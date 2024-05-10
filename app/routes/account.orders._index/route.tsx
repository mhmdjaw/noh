import { Link, useLoaderData, type MetaFunction } from '@remix-run/react'
import { Money, Pagination, getPaginationVariables, flattenConnection } from '@shopify/hydrogen'
import { json, type LoaderFunctionArgs } from '@shopify/remix-oxygen'
import { CUSTOMER_ORDERS_QUERY } from '~/graphql/customer-account/CustomerOrdersQuery'
import type { CustomerOrdersFragment, OrderItemFragment } from 'customer-accountapi.generated'
import { Anchor, Button, Group, Stack, Text } from '@mantine/core'
import styles from './account.orders._index.module.css'

export const meta: MetaFunction = () => {
  return [{ title: 'Orders' }]
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 20
  })

  const { data, errors } = await context.customerAccount.query(CUSTOMER_ORDERS_QUERY, {
    variables: {
      ...paginationVariables
    }
  })

  if (errors?.length || !data?.customer) {
    throw Error('Customer orders not found')
  }

  return json(
    { customer: data.customer },
    {
      headers: {
        'Set-Cookie': await context.session.commit()
      }
    }
  )
}

export default function Orders() {
  const { customer } = useLoaderData<{ customer: CustomerOrdersFragment }>()
  const { orders } = customer
  return <div className="orders">{orders.nodes.length ? <OrdersTable orders={orders} /> : <EmptyOrders />}</div>
}

function OrdersTable({ orders }: Pick<CustomerOrdersFragment, 'orders'>) {
  return (
    <Stack align="center">
      {orders?.nodes.length ? (
        <Pagination connection={orders}>
          {({ nodes, isLoading, PreviousLink, NextLink }) => {
            return (
              <>
                <Button
                  component={PreviousLink}
                  variant="outline"
                  color="black"
                  loaderProps={{ type: 'dots' }}
                  loading={isLoading}
                >
                  Load Previous
                </Button>
                {nodes.map((order) => {
                  return <OrderItem key={order.id} order={order} />
                })}
                <Button
                  component={NextLink}
                  variant="outline"
                  color="black"
                  loaderProps={{ type: 'dots' }}
                  loading={isLoading}
                >
                  Load More
                </Button>
              </>
            )
          }}
        </Pagination>
      ) : (
        <EmptyOrders />
      )}
    </Stack>
  )
}

function EmptyOrders() {
  return (
    <Stack align="center" ta="center" gap="xl">
      <Text fw="var(--mantine-fw-sb)" size="lg">
        You haven&apos;t placed any orders yet, let&rsquo;s get you started!
      </Text>
      <Button component={Link} to="/collections/shop-all" size="md" variant="outline" color="black">
        START SHOPPING
      </Button>
    </Stack>
  )
}

function OrderItem({ order }: { order: OrderItemFragment }) {
  const fulfillmentStatus = flattenConnection(order.fulfillments)[0]?.status

  const orderDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(order.processedAt!))

  return (
    <Stack className={styles.orderItem}>
      <Group justify="space-between">
        <Text fw="var(--mantine-fw-sb)" fz={18}>
          Order
        </Text>
        <Anchor component={Link} to={`/account/orders/${btoa(order.id)}`} fz={18} underline="always">
          <strong>#{order.number}</strong>
        </Anchor>
      </Group>
      <Stack gap="xs">
        <Group justify="space-between">
          <Text fz={18} fw="var(--mantine-fw-md)">
            Date
          </Text>
          <Text fz={18} fw="var(--mantine-fw-md)">
            {orderDate}
          </Text>
        </Group>
        <Group justify="space-between">
          <Text fz={18} fw="var(--mantine-fw-md)">
            Payment Status
          </Text>
          <Text fz={18} fw="var(--mantine-fw-md)">
            {order.financialStatus}
          </Text>
        </Group>
        <Group justify="space-between">
          <Text fz={18} fw="var(--mantine-fw-md)">
            Fulfillment Status
          </Text>
          <Text fz={18} fw="var(--mantine-fw-md)">
            {fulfillmentStatus || 'UNFULFILLED'}
          </Text>
        </Group>
        <Group justify="space-between">
          <Text fz={18} fw="var(--mantine-fw-md)">
            Total
          </Text>
          <Text fz={18} fw="var(--mantine-fw-md)">
            <Money data={order.totalPrice} />
          </Text>
        </Group>
      </Stack>
    </Stack>
  )
}
