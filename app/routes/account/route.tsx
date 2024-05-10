import { json, type LoaderFunctionArgs } from '@shopify/remix-oxygen'
import { NavLink, Outlet, useLoaderData } from '@remix-run/react'
import { CUSTOMER_DETAILS_QUERY } from '~/graphql/customer-account/CustomerDetailsQuery'
import { Anchor, Container, Group } from '@mantine/core'
import styles from './account.module.css'

export function shouldRevalidate() {
  return true
}

export async function loader({ context }: LoaderFunctionArgs) {
  const { data, errors } = await context.customerAccount.query(CUSTOMER_DETAILS_QUERY)

  if (errors?.length || !data?.customer) {
    throw new Error('Customer not found')
  }

  return json(
    { customer: data.customer },
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Set-Cookie': await context.session.commit()
      }
    }
  )
}

export default function AccountLayout() {
  const { customer } = useLoaderData<typeof loader>()

  return (
    <Container size={450} className={styles.accountContainer}>
      <AccountMenu />
      <Outlet context={{ customer }} />
    </Container>
  )
}

function AccountMenu() {
  return (
    <nav role="navigation" className={styles.accountNavigation}>
      <Group justify="space-between">
        {ACCOUNT_MENU.map((item) => (
          <Anchor
            key={item.title}
            component={NavLink}
            className={styles.accountLink}
            to={`/account/${item.handle}`}
            // underline="never"
          >
            {item.title}
          </Anchor>
        ))}
      </Group>
    </nav>
  )
}

const ACCOUNT_MENU = [
  {
    title: 'Profile',
    handle: 'profile'
  },
  {
    title: 'Orders',
    handle: 'orders'
  },
  {
    title: 'Addresses',
    handle: 'addresses'
  }
]
