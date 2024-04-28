import { json, redirect, type LoaderFunctionArgs } from '@shopify/remix-oxygen'
import { useLoaderData, Link, type MetaFunction } from '@remix-run/react'
import { Pagination, getPaginationVariables, Image } from '@shopify/hydrogen'
import type { ProductItemFragment } from 'storefrontapi.generated'
import { useVariantUrl } from '~/lib/variants'
import { Anchor, Grid, Overlay, Title } from '@mantine/core'
import styles from './collections.$handle.module.css'

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: `NOH | ${data?.collection.title ?? ''}` }]
}

export async function loader({ request, params, context }: LoaderFunctionArgs) {
  const { handle } = params
  const { storefront } = context
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 50
  })

  if (!handle) {
    return redirect('/')
  }

  const { collection } = await storefront.query(COLLECTION_QUERY, {
    variables: { handle, ...paginationVariables }
  })

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404
    })
  }
  return json({ collection })
}

export default function Collection() {
  const { collection } = useLoaderData<typeof loader>()

  return (
    <div className="collection">
      <Title hidden order={1}>
        {collection.title}
      </Title>
      <Pagination connection={collection.products}>
        {({ nodes }) => (
          <>
            {/* <PreviousLink>{isLoading ? 'Loading...' : <span>↑ Load previous</span>}</PreviousLink> */}
            <ProductsGrid products={nodes} />
            {/* <NextLink>{isLoading ? 'Loading...' : <span>Load more ↓</span>}</NextLink> */}
          </>
        )}
      </Pagination>
    </div>
  )
}

function ProductsGrid({ products }: { products: ProductItemFragment[] }) {
  return (
    <Grid gutter={0}>
      {products.map((product, index) => {
        return <ProductItem key={product.id} product={product} loading={index < 50 ? 'eager' : undefined} />
      })}
    </Grid>
  )
}

function ProductItem({ product, loading }: { product: ProductItemFragment; loading?: 'eager' | 'lazy' }) {
  const variant = product.variants.nodes[0]
  const variantUrl = useVariantUrl(product.handle, variant.selectedOptions)
  return (
    <Grid.Col key={product.id} span={{ base: 6, sm: 4 }}>
      <Anchor className={styles.productItem} component={Link} prefetch="intent" to={variantUrl}>
        {product.images.nodes[0] && (
          <Image alt={product.title} width="100%" data={product.images.nodes[0]} loading="eager" />
        )}
        {product.images.nodes[1] && (
          <Image alt={product.title} width="100%" data={product.images.nodes[1]} loading="eager" />
        )}
        <Overlay
          className={styles.productItemOverlay}
          gradient="linear-gradient(180deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0) 100%)"
          zIndex={2}
        >
          <Title order={1} fz={{ base: 'h3', xs: 'h2', sm: 'h1', lg: '48' }}>
            {product.title}
          </Title>
        </Overlay>
      </Anchor>
    </Grid.Col>
  )
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductImageItem on Image {
    id
    altText
    url
    width
    height
  }
  fragment ProductItem on Product {
    id
    handle
    title
    images(first: 2) {
      nodes {
        ...ProductImageItem
      }
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
    variants(first: 1) {
      nodes {
        selectedOptions {
          name
          value
        }
      }
    }
  }
` as const

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
` as const
