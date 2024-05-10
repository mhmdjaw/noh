import { json, redirect, type LoaderFunctionArgs } from '@shopify/remix-oxygen'
import { useLoaderData, type MetaFunction } from '@remix-run/react'
import { Money, Image, flattenConnection } from '@shopify/hydrogen'
import type { OrderLineItemFullFragment } from 'customer-accountapi.generated'
import { CUSTOMER_ORDER_QUERY } from '~/graphql/customer-account/CustomerOrderQuery'
import { Button, Grid, Group, Stack, Table, Text, Title } from '@mantine/core'
import styles from './account.orders.$id.module.css'

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: `Order ${data?.order?.name}` }]
}

export async function loader({ params, context, request }: LoaderFunctionArgs) {
  if (!params.id) {
    return redirect('/account/orders')
  }

  const orderId = atob(params.id)
  const { data, errors } = await context.customerAccount.query(CUSTOMER_ORDER_QUERY, {
    variables: { orderId }
  })

  if (errors?.length || !data?.order) {
    throw new Error('Order not found')
  }

  const { order } = data

  const lineItems = flattenConnection(order.lineItems)
  const discountApplications = flattenConnection(order.discountApplications)
  const fulfillmentStatus = flattenConnection(order.fulfillments)[0]?.status

  const firstDiscount = discountApplications[0]?.value

  const discountValue = firstDiscount?.__typename === 'MoneyV2' && firstDiscount

  const discountPercentage = firstDiscount?.__typename === 'PricingPercentageValue' && firstDiscount?.percentage

  return json(
    {
      order,
      lineItems,
      discountValue,
      discountPercentage,
      fulfillmentStatus
    },
    {
      headers: {
        'Set-Cookie': await context.session.commit()
      }
    }
  )
}

export default function OrderRoute() {
  const { order, lineItems, discountValue, discountPercentage, fulfillmentStatus } = useLoaderData<typeof loader>()

  const orderDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeStyle: 'short'
  }).format(new Date(order.processedAt!))

  return (
    <div className="account-order">
      <Title order={2} mb={16}>
        Order {order.name}
      </Title>
      <Text mb={16}>{orderDate}</Text>
      <div>
        <Table withTableBorder withColumnBorders>
          <Table.Thead fz={18}>
            <Table.Tr>
              <Table.Th>Product</Table.Th>
              <Table.Th>Price</Table.Th>
              <Table.Th>Quantity</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {lineItems.map((lineItem, lineItemIndex) => (
              // eslint-disable-next-line react/no-array-index-key
              <OrderLineRow key={lineItemIndex} lineItem={lineItem} />
            ))}
          </Table.Tbody>
        </Table>
        <Stack my={24} gap="sm">
          <Group gap={0}>
            <Text className={styles.summaryTitle}>Subtotal</Text>
            <Text className={styles.summaryValue}>
              <Money data={order.subtotal!} />
            </Text>
          </Group>
          <Group gap={0}>
            <Text className={styles.summaryTitle}>Tax</Text>
            <Text className={styles.summaryValue}>
              <Money data={order.totalTax!} />
            </Text>
          </Group>
          <Group gap={0}>
            <Text className={styles.summaryTitle}>Total</Text>
            <Text className={styles.summaryValue}>
              <Money data={order.totalPrice!} />
            </Text>
          </Group>
        </Stack>
        <Grid gutter={0}>
          <Grid.Col span={6} pr={16}>
            <Stack gap={16}>
              <Title fz={18}>Shipping Address</Title>
              {order?.shippingAddress ? (
                <address>
                  <Text fw="var(--mantine-fw-sb)" mb={16}>
                    {order.shippingAddress.name}
                  </Text>
                  {order.shippingAddress.formatted
                    ? order.shippingAddress.formatted.map((addressValue, i) =>
                        i === 0 ? <></> : <Text key={addressValue}>{addressValue}</Text>
                      )
                    : ''}
                </address>
              ) : (
                <p>No shipping address defined</p>
              )}
            </Stack>
          </Grid.Col>
          <Grid.Col span={6}>
            <Stack gap={16}>
              <Title fz={18}>Billing Address</Title>
              {order?.billingAddress ? (
                <address>
                  <Text fw="var(--mantine-fw-sb)" mb={16}>
                    {order.billingAddress.name}
                  </Text>
                  {order.billingAddress.formatted
                    ? order.billingAddress.formatted.map((addressValue, i) =>
                        i === 0 ? <></> : <Text key={addressValue}>{addressValue}</Text>
                      )
                    : ''}
                </address>
              ) : (
                <p>No billing address defined</p>
              )}
            </Stack>
          </Grid.Col>
          <Grid.Col span={6} mt={24}>
            <Title fz={18} mb={16}>
              Fulfillment Status
            </Title>
            <Text fw="var(--mantine-fw-md)">{fulfillmentStatus || 'UNFULFILLED'}</Text>
          </Grid.Col>
          <Grid.Col span={6} mt={24}>
            <Title fz={18} mb={16}>
              Financial Status
            </Title>
            <Text fw="var(--mantine-fw-md)">{order.financialStatus}</Text>
          </Grid.Col>
        </Grid>
      </div>
      <Button
        mt={24}
        variant="outline"
        color="black"
        component="a"
        target="_blank"
        href={order.statusPageUrl}
        rel="noreferrer"
      >
        View Order Status
      </Button>
    </div>
  )
}

function OrderLineRow({ lineItem }: { lineItem: OrderLineItemFullFragment }) {
  return (
    <Table.Tr>
      <Table.Td>
        <Stack>
          {lineItem?.image && <Image className={styles.productImage} data={lineItem.image} width={96} />}
          <div>
            <Text size="md" fw="var(--mantine-fw-sb)">
              {lineItem.title}
            </Text>
            <Text size="sm" fw="var(--mantine-fw-sb)" c="var(--mantine-color-gray-text)">
              {lineItem.variantTitle}
            </Text>
          </div>
        </Stack>
      </Table.Td>
      <Table.Td>
        <Text fw="var(--mantine-fw-md)">
          <Money data={lineItem.price!} />
        </Text>
      </Table.Td>
      <Table.Td>
        <Text fw="var(--mantine-fw-md)">{lineItem.quantity}</Text>
      </Table.Td>
      {/* <Table.Td>
        <Money data={lineItem.totalDiscount!} />
      </Table.Td> */}
    </Table.Tr>
  )
}
