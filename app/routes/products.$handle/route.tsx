import { Suspense, useCallback, useState } from 'react'
import { defer, redirect, type LoaderFunctionArgs } from '@shopify/remix-oxygen'
import { Await, Link, useLoaderData, type MetaFunction, type FetcherWithComponents } from '@remix-run/react'
import type { ProductFragment, ProductVariantsQuery, ProductVariantFragment } from 'storefrontapi.generated'
import {
  Image,
  Money,
  VariantSelector,
  type VariantOption,
  getSelectedProductOptions,
  CartForm
} from '@shopify/hydrogen'
import type { CartLineInput, ProductOption, SelectedOption } from '@shopify/hydrogen/storefront-api-types'
import { getVariantUrl } from '~/lib/variants'
import {
  Accordion,
  AccordionControl,
  AccordionPanel,
  Anchor,
  Button,
  Chip,
  Grid,
  Group,
  Modal,
  Stack,
  Title,
  UnstyledButton
} from '@mantine/core'
import styles from './products.$handle.module.css'
import { HiPlus } from 'react-icons/hi2'
import { useDisclosure, useViewportSize } from '@mantine/hooks'

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: `NOH | ${data?.product.title ?? ''}` }]
}

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const { handle } = params
  const { storefront } = context

  const selectedOptions = getSelectedProductOptions(request).filter(
    (option) =>
      // Filter out Shopify predictive search query params
      !option.name.startsWith('_sid') &&
      !option.name.startsWith('_pos') &&
      !option.name.startsWith('_psq') &&
      !option.name.startsWith('_ss') &&
      !option.name.startsWith('_v') &&
      // Filter out third party tracking params
      !option.name.startsWith('fbclid')
  )

  if (!handle) {
    throw new Error('Expected product handle to be defined')
  }

  // await the query for the critical product data
  const { product } = await storefront.query(PRODUCT_QUERY, {
    variables: { handle, selectedOptions }
  })

  if (!product?.id) {
    throw new Response(null, { status: 404 })
  }

  const firstVariant = product.variants.nodes[0]
  const firstVariantIsDefault = Boolean(
    firstVariant.selectedOptions.find(
      (option: SelectedOption) => option.name === 'Title' && option.value === 'Default Title'
    )
  )

  if (firstVariantIsDefault) {
    product.selectedVariant = firstVariant
  } else {
    // if no selected variant was returned from the selected options,
    // we redirect to the first variant's url with it's selected options applied
    if (!product.selectedVariant) {
      throw redirectToFirstVariant({ product, request })
    }
  }

  // In order to show which variants are available in the UI, we need to query
  // all of them. But there might be a *lot*, so instead separate the variants
  // into it's own separate query that is deferred. So there's a brief moment
  // where variant options might show as available when they're not, but after
  // this deffered query resolves, the UI will update.
  const variants = storefront.query(VARIANTS_QUERY, {
    variables: { handle }
  })

  return defer({ product, variants })
}

function redirectToFirstVariant({ product, request }: { product: ProductFragment; request: Request }) {
  const url = new URL(request.url)
  const firstVariant = product.variants.nodes[0]

  return redirect(
    getVariantUrl({
      pathname: url.pathname,
      handle: product.handle,
      selectedOptions: firstVariant.selectedOptions,
      searchParams: new URLSearchParams(url.search)
    }),
    {
      status: 302
    }
  )
}

export default function Product() {
  const { product, variants } = useLoaderData<typeof loader>()
  const { selectedVariant } = product
  return (
    <Grid gutter={0}>
      <Grid.Col span={{ base: 12, sm: 4 }} order={{ base: 2, sm: 1 }}>
        <ProductMain selectedVariant={selectedVariant} product={product} variants={variants} />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 4 }} order={{ base: 1, sm: 2 }}>
        <ProductImages variantImage={selectedVariant?.image} images={product.images.nodes} />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 4 }} order={{ base: 3, sm: 3 }}>
        <ProductAction selectedVariant={selectedVariant} />
      </Grid.Col>
    </Grid>
  )
}

function ProductImages({
  variantImage,
  images
}: {
  variantImage: ProductVariantFragment['image']
  images: ProductFragment['images']['nodes']
}) {
  const [opened, { open, close }] = useDisclosure(false)
  const [imageData, setImageData] = useState<ProductVariantFragment['image'] | null>(null)

  if (!variantImage) {
    return <div className={styles.productImage} />
  }

  const imageClicked = (data: ProductVariantFragment['image']) => () => {
    setImageData(data)
    open()
  }

  return (
    <div className={styles.imageGrid}>
      <UnstyledButton className={styles.zoomIn} key={variantImage.id} onClick={imageClicked(variantImage)}>
        <div className={styles.productImage}>
          <Image alt={variantImage.altText || 'Product Image'} data={variantImage} width="100%" loading="lazy" />
        </div>
      </UnstyledButton>
      {images.map(
        (data) =>
          (!data.altText || variantImage.altText === data.altText) &&
          variantImage.url !== data.url && (
            <UnstyledButton className={styles.zoomIn} key={data.id} onClick={imageClicked(data)}>
              <div className={styles.productImage}>
                <Image alt={data.altText || 'Product Image'} data={data} width="100%" loading="lazy" />
              </div>
            </UnstyledButton>
          )
      )}
      <FullscreenImage opened={opened} close={close} data={imageData} />
    </div>
  )
}

function FullscreenImage({
  opened,
  close,
  data
}: {
  opened: boolean
  close: () => void
  data: ProductVariantFragment['image']
}) {
  const { height, width } = useViewportSize()

  const ref = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const elWidth = node.offsetWidth / 2
      node.scrollLeft = node.scrollWidth / 2 - elWidth
    }
  }, [])

  return (
    <Modal
      opened={Boolean(data) && opened}
      onClose={close}
      fullScreen
      radius={0}
      transitionProps={{ transition: 'fade', duration: 200 }}
      zIndex={99999}
      classNames={{ header: styles.modalHeader, body: styles.modalBody }}
      closeButtonProps={{ c: 'var(--mantine-color-text)', radius: 'xl', size: 'xl', iconSize: 24 }}
    >
      <Group ref={ref} gap={0} className={styles.modalScrollableArea}>
        {data && (
          <Image
            alt={data.altText || 'Product Image'}
            data={data}
            style={{
              width: width > height ? '100%' : 'auto',
              height: height > width ? '100%' : 'auto',
              cursor: 'zoom-out'
            }}
            onClick={close}
          />
        )}
      </Group>
    </Modal>
  )
}

function ProductMain({
  selectedVariant,
  product,
  variants
}: {
  product: ProductFragment
  selectedVariant: ProductFragment['selectedVariant']
  variants: Promise<ProductVariantsQuery>
}) {
  return (
    <div className={styles.stickySection}>
      <Stack maw={400} p={32}>
        <Title order={1}>{product.title}</Title>
        <ProductPrice selectedVariant={selectedVariant} />
        <Suspense fallback={<ProductContent product={product} variants={[]} />}>
          <Await resolve={variants}>
            {(data) => <ProductContent product={product} variants={data.product?.variants.nodes || []} />}
          </Await>
        </Suspense>
      </Stack>
    </div>
  )
}

function ProductPrice({ selectedVariant }: { selectedVariant: ProductFragment['selectedVariant'] }) {
  return (
    <div className={styles.productOnSale}>
      {selectedVariant?.compareAtPrice ? (
        <>
          <s>
            <Money data={selectedVariant.compareAtPrice} />
          </s>
          {selectedVariant ? <Money data={selectedVariant.price} /> : null}
        </>
      ) : (
        selectedVariant?.price && <Money data={selectedVariant?.price} />
      )}
    </div>
  )
}

function ProductContent({ product, variants }: { product: ProductFragment; variants: Array<ProductVariantFragment> }) {
  const options: Pick<ProductOption, 'name' | 'values'>[] = product.options.map((option) => ({
    name: option.name,
    values: option.values.length === 1 ? [option.values[0], ''] : option.values
  }))

  return (
    <Accordion
      defaultValue="Description"
      classNames={{
        item: styles.accordionItem,
        control: styles.accordionControl,
        label: styles.accordionLabel,
        panel: styles.accordionPanel,
        content: styles.accordionContent,
        chevron: styles.accordionChevron
      }}
      chevron={<HiPlus />}
    >
      <Accordion.Item key="Description" value="Description">
        <AccordionControl>Description</AccordionControl>
        <AccordionPanel>
          <div dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
        </AccordionPanel>
      </Accordion.Item>
      <VariantSelector handle={product.handle} options={options} variants={variants}>
        {({ option }) => (
          <Accordion.Item key={option.name} value={option.name}>
            <AccordionControl>{option.name}</AccordionControl>
            <AccordionPanel>
              <ProductOptions option={option} />
            </AccordionPanel>
          </Accordion.Item>
        )}
      </VariantSelector>
    </Accordion>
  )
}

function ProductOptions({ option }: { option: VariantOption }) {
  return (
    <Group>
      {option.values.map(({ value, isAvailable, isActive, to }) => {
        if (!value) return <></>
        return (
          <Anchor key={option.name + value} component={Link} prefetch="intent" preventScrollReset replace to={to}>
            <Chip classNames={{ label: styles.chipLabel }} checked={isActive}>
              {value}
            </Chip>
          </Anchor>
        )
      })}
    </Group>
  )
}

function ProductAction({ selectedVariant }: { selectedVariant: ProductFragment['selectedVariant'] }) {
  return (
    <div className={styles.stickySection}>
      <AddToCartButton
        disabled={!selectedVariant || !selectedVariant.availableForSale}
        lines={
          selectedVariant
            ? [
                {
                  merchandiseId: selectedVariant.id,
                  quantity: 1
                }
              ]
            : []
        }
      >
        {selectedVariant?.availableForSale ? 'ADD TO BAG' : 'SOLD OUT'}
      </AddToCartButton>
    </div>
  )
}

function AddToCartButton({
  analytics,
  children,
  disabled,
  lines
}: {
  analytics?: unknown
  children: React.ReactNode
  disabled?: boolean
  lines: CartLineInput[]
}) {
  return (
    <CartForm route="/cart" inputs={{ lines }} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher: FetcherWithComponents<any>) => (
        <>
          <input name="analytics" type="hidden" value={JSON.stringify(analytics)} />
          <Button
            type="submit"
            disabled={disabled}
            loading={fetcher.state !== 'idle'}
            loaderProps={{ type: 'dots' }}
            size="xl"
            mb={{ base: 40, sm: 0 }}
          >
            {children}
          </Button>
        </>
      )}
    </CartForm>
  )
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
` as const

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    options {
      name
      values
    }
    images(first: 250) {
      nodes {
        __typename
        id
        url
        altText
        width
        height
      }
    }
    selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    variants(first: 1) {
      nodes {
        ...ProductVariant
      }
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const

const PRODUCT_VARIANTS_FRAGMENT = `#graphql
  fragment ProductVariants on Product {
    variants(first: 250) {
      nodes {
        ...ProductVariant
      }
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const

const VARIANTS_QUERY = `#graphql
  ${PRODUCT_VARIANTS_FRAGMENT}
  query ProductVariants(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...ProductVariants
    }
  }
` as const
