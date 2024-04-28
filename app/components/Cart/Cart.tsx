import { CartForm, Image, Money, OptimisticInput, useOptimisticData } from '@shopify/hydrogen'
import type { CartLineUpdateInput } from '@shopify/hydrogen/storefront-api-types'
import { Link } from '@remix-run/react'
import type { CartApiQueryFragment } from 'storefrontapi.generated'
import { useVariantUrl } from '~/lib/variants'
import styles from './Cart.module.css'
import { ActionIcon, Anchor, Box, Button, Divider, Group, Stack, Text, Title } from '@mantine/core'
import { HiMinus, HiPlus } from 'react-icons/hi2'
import { IconContext } from 'react-icons'
import cx from 'clsx'
import { useCartFetchers } from '~/hooks'

type CartLine = CartApiQueryFragment['lines']['nodes'][0]

type CartMainProps = {
  cart: CartApiQueryFragment | null
  close?: () => void
}

export function CartMain({ cart, close }: CartMainProps) {
  const linesCount = Boolean(cart?.lines?.nodes?.length || 0)
  // const withDiscount = cart && Boolean(cart?.discountCodes?.filter((code) => code.applicable)?.length)

  return (
    <>
      <CartEmpty hidden={linesCount} close={close} />
      <CartDetails cart={cart} close={close} />
    </>
  )
}

function CartDetails({ cart, close }: CartMainProps) {
  const cartHasItems = !!cart && cart.totalQuantity > 0

  return (
    <>
      {cartHasItems && (
        <>
          <CartLines lines={cart?.lines} />
          <CartSummary cost={cart.cost}>
            {/* <CartDiscounts discountCodes={cart.discountCodes} /> */}
            <CartCheckoutActions checkoutUrl={cart.checkoutUrl} close={close} />
          </CartSummary>
        </>
      )}
    </>
  )
}

function CartLines({ lines }: { lines: CartApiQueryFragment['lines'] | undefined }) {
  if (!lines) return null

  return (
    <div aria-labelledby="cart-lines" className={styles.cartLines}>
      {lines.nodes.map((line, i) => (
        <>
          <CartLineItem key={line.id} line={line} />
          {i < lines.nodes.length - 1 && <Divider />}
        </>
      ))}
    </div>
  )
}

function CartLineItem({ line }: { line: CartLine }) {
  const { id, merchandise } = line
  const { product, title, image, selectedOptions } = merchandise
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions)

  const removeFromCartFetchers = useCartFetchers(CartForm.ACTIONS.LinesRemove)

  const removeLoading = removeFromCartFetchers.some((fetcher) => {
    return (
      (fetcher.inputs.lineIds as string[])[0] === id && (fetcher.state === 'loading' || fetcher.state === 'submitting')
    )
  })

  return (
    <Group
      gap={0}
      key={id}
      align="stretch"
      justify="center"
      className={cx({ [styles.cartLineUpdating]: removeLoading })}
    >
      <Link to={lineItemUrl} className={styles.cartLineImageLink}>
        {image && <Image className={styles.cartLineImage} alt={title} data={image} loading="lazy" />}
      </Link>
      <Stack miw={0} justify="space-between" p={{ base: 8, sm: 16 }} flex="1 1 0">
        <Group align="flex-start">
          <Box flex="1 1 0">
            <Anchor component={Link} prefetch="intent" to={lineItemUrl}>
              <Text size="xl">
                <strong>{product.title}</strong>
              </Text>
            </Anchor>
            {/* <ul>
            {selectedOptions.map((option) => (
              <li key={option.name}>
                <small>
                  {option.name}: {option.value}
                </small>
              </li>
            ))}
          </ul> */}
            <Text size="md" fw="var(--mantine-fw-b)" c="var(--mantine-color-gray-text)">
              {selectedOptions.map((option, i) => option.value + (i < selectedOptions.length - 1 ? ' / ' : ''))}
            </Text>
          </Box>
          <CartLinePrice line={line} />
        </Group>
        {<CartLineQuantity line={line} />}
      </Stack>
    </Group>
  )
}

function CartCheckoutActions({ checkoutUrl, close }: { checkoutUrl: string; close: CartMainProps['close'] }) {
  const removeFromCartFetchers = useCartFetchers(CartForm.ACTIONS.LinesRemove)
  const updateCartFetchers = useCartFetchers(CartForm.ACTIONS.LinesUpdate)

  if (!checkoutUrl) return null

  const removeLoading = removeFromCartFetchers.some((fetcher) => {
    return fetcher.state === 'loading' || fetcher.state === 'submitting'
  })
  const updateLoading = updateCartFetchers.some((fetcher) => {
    return fetcher.state === 'loading' || fetcher.state === 'submitting'
  })

  return (
    <Stack gap="md" pt={24}>
      <Button
        component="a"
        href={checkoutUrl}
        target="_self"
        size="lg"
        loaderProps={{ type: 'dots' }}
        loading={removeLoading || updateLoading}
      >
        CHECKOUT
      </Button>
      <Button component={Link} to="/collections/shop-all" size="lg" variant="outline" onClick={close}>
        SHOP MORE
      </Button>
    </Stack>
  )
}

function CartSummary({ cost, children = null }: { children?: React.ReactNode; cost: CartApiQueryFragment['cost'] }) {
  const removeFromCartFetchers = useCartFetchers(CartForm.ACTIONS.LinesRemove)
  const updateCartFetchers = useCartFetchers(CartForm.ACTIONS.LinesUpdate)

  const removeLoading = removeFromCartFetchers.some((fetcher) => {
    return fetcher.state === 'loading' || fetcher.state === 'submitting'
  })
  const updateLoading = updateCartFetchers.some((fetcher) => {
    return fetcher.state === 'loading' || fetcher.state === 'submitting'
  })

  return (
    <div aria-labelledby="cart-summary" className={styles.cartSummary}>
      <Group justify="space-between">
        <Title order={3} c="var(--mantine-color-gray-text)">
          SUBTOTAL:
        </Title>
        <Text
          size="lg"
          fw="var(--mantine-fw-sb)"
          className={cx({ [styles.cartLineUpdating]: removeLoading || updateLoading })}
        >
          {cost?.subtotalAmount?.amount ? <Money data={cost?.subtotalAmount} /> : '-'}
        </Text>
      </Group>
      <Divider my="md" color="var(--mantine-color-gray-text)" />
      <Group>
        <Title order={3} c="var(--mantine-color-gray-text)">
          SHIPPING & TAXES:
        </Title>
        <Text size="lg" fw="var(--mantine-fw-sb)" miw={0} flex="1 1 0" ta="right">
          calculated at checkout
        </Text>
      </Group>
      <Divider my="md" color="var(--mantine-color-gray-text)" />
      {children}
    </div>
  )
}

function CartLineRemoveButton({ lineIds }: { lineIds: string[] }) {
  return (
    <CartForm route="/cart" action={CartForm.ACTIONS.LinesRemove} inputs={{ lineIds }}>
      <Anchor
        component="button"
        type="submit"
        c="var(--mantine-color-gray-text)"
        fw="var(--mantine-fw-sb)"
        underline="always"
      >
        Remove
      </Anchor>
    </CartForm>
  )
}

function CartLineQuantity({ line }: { line: CartLine }) {
  const { id: lineId, quantity } = line

  const optimistic = useOptimisticData(lineId) as { quantity: number }

  if (!line || typeof quantity === 'undefined') return null

  const optimisticQuantity = optimistic.quantity || line.quantity

  const prevQuantity = Number(Math.max(0, optimisticQuantity - 1).toFixed(0))
  const nextQuantity = Number((optimisticQuantity + 1).toFixed(0))

  return (
    <Group justify="space-between">
      <Group gap={5}>
        {/* <small>Quantity: {quantity} &nbsp;&nbsp;</small> */}
        <Text fw="var(--mantine-fw-md)" c="var(--mantine-color-gray-text)">
          Quantity
        </Text>
        <IconContext.Provider value={{ size: '70%' }}>
          <CartLineUpdateButton lines={[{ id: lineId, quantity: prevQuantity }]}>
            <ActionIcon
              variant="transparent"
              aria-label="Decrease quantity"
              disabled={optimisticQuantity <= 1}
              name="decrease-quantity"
              value={prevQuantity}
              type="submit"
              bg="transparent"
            >
              <HiMinus />
            </ActionIcon>
            <OptimisticInput id={lineId} data={{ quantity: prevQuantity }} />
          </CartLineUpdateButton>
          <Text fw="var(--mantine-fw-md)" c="var(--mantine-color-gray-text)">
            {optimisticQuantity}
          </Text>
          <CartLineUpdateButton lines={[{ id: lineId, quantity: nextQuantity }]}>
            <ActionIcon
              variant="transparent"
              aria-label="Increase quantity"
              disabled={optimisticQuantity >= 10}
              name="increase-quantity"
              value={nextQuantity}
              type="submit"
              bg="transparent"
            >
              <HiPlus />
            </ActionIcon>
            <OptimisticInput id={lineId} data={{ quantity: nextQuantity }} />
          </CartLineUpdateButton>
        </IconContext.Provider>
      </Group>
      <CartLineRemoveButton lineIds={[lineId]} />
    </Group>
  )
}

function CartLinePrice({ line, priceType = 'regular' }: { line: CartLine; priceType?: 'regular' | 'compareAt' }) {
  const updateCartFetchers = useCartFetchers(CartForm.ACTIONS.LinesUpdate)

  if (!line?.cost?.amountPerQuantity || !line?.cost?.totalAmount) return null

  const updateLoading = updateCartFetchers.some((fetcher) => {
    return (
      (fetcher.inputs.lines as CartLine[])[0].id === line.id &&
      (fetcher.state === 'loading' || fetcher.state === 'submitting')
    )
  })

  const moneyV2 = priceType === 'regular' ? line.cost.totalAmount : line.cost.compareAtAmountPerQuantity

  if (moneyV2 == null) {
    return null
  }

  return (
    <Text size="lg" fw="var(--mantine-fw-sb)" className={cx({ [styles.cartLineUpdating]: updateLoading })}>
      <Money withoutTrailingZeros data={moneyV2} />
    </Text>
  )
}

function CartEmpty({ hidden = false, close }: { hidden: boolean; close: CartMainProps['close'] }) {
  if (hidden) return null

  return (
    <Group flex="1 1 auto">
      <Stack align="center" ta="center" p={16} flex="1 1 auto">
        <Text fw="var(--mantine-fw-sb)" size="lg">
          Looks like you haven&rsquo;t added anything yet, let&rsquo;s get you started!
        </Text>
        <Button component={Link} to="/collections/shop-all" onClick={close} size="lg" variant="outline" color="black">
          CONTINUE SHOPPING
        </Button>
      </Stack>
    </Group>
  )
}

// function CartDiscounts({ discountCodes }: { discountCodes: CartApiQueryFragment['discountCodes'] }) {
//   const codes: string[] = discountCodes?.filter((discount) => discount.applicable)?.map(({ code }) => code) || []

//   return (
//     <div>
//       {/* Have existing discount, display it with a remove option */}
//       <dl hidden={!codes.length}>
//         <div>
//           <dt>Discount(s)</dt>
//           <UpdateDiscountForm>
//             <div className="cart-discount">
//               <code>{codes?.join(', ')}</code>
//               &nbsp;
//               <button>Remove</button>
//             </div>
//           </UpdateDiscountForm>
//         </div>
//       </dl>

//       {/* Show an input to apply a discount */}
//       <UpdateDiscountForm discountCodes={codes}>
//         <div>
//           <input type="text" name="discountCode" placeholder="Discount code" />
//           &nbsp;
//           <button type="submit">Apply</button>
//         </div>
//       </UpdateDiscountForm>
//     </div>
//   )
// }

// function UpdateDiscountForm({ discountCodes, children }: { discountCodes?: string[]; children: React.ReactNode }) {
//   return (
//     <CartForm
//       route="/cart"
//       action={CartForm.ACTIONS.DiscountCodesUpdate}
//       inputs={{
//         discountCodes: discountCodes || []
//       }}
//     >
//       {children}
//     </CartForm>
//   )
// }

function CartLineUpdateButton({ children, lines }: { children: React.ReactNode; lines: CartLineUpdateInput[] }) {
  return (
    <CartForm route="/cart" action={CartForm.ACTIONS.LinesUpdate} inputs={{ lines }}>
      {children}
    </CartForm>
  )
}
