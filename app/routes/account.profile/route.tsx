import type { CustomerFragment } from 'customer-accountapi.generated'
import type { CustomerUpdateInput } from '@shopify/hydrogen/customer-account-api-types'
import { CUSTOMER_UPDATE_MUTATION } from '~/graphql/customer-account/CustomerUpdateMutation'
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@shopify/remix-oxygen'
import { Form, useActionData, useNavigation, useOutletContext, type MetaFunction } from '@remix-run/react'
import { Alert, Button, Stack, TextInput } from '@mantine/core'
import { MdErrorOutline } from 'react-icons/md'

export type ActionResponse = {
  error: string | null
  customer: CustomerFragment | null
}

export const meta: MetaFunction = () => {
  return [{ title: 'Profile' }]
}

export async function loader({ context }: LoaderFunctionArgs) {
  await context.customerAccount.handleAuthStatus()

  return json(
    {},
    {
      headers: {
        'Set-Cookie': await context.session.commit()
      }
    }
  )
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { customerAccount } = context

  if (request.method !== 'PUT') {
    return json({ error: 'Method not allowed' }, { status: 405 })
  }

  const form = await request.formData()

  const customer: CustomerUpdateInput = {}
  const validInputKeys = ['firstName', 'lastName'] as const
  for (const [key, value] of form.entries()) {
    if (!validInputKeys.includes(key as any)) {
      continue
    }
    if (typeof value === 'string' && value.length) {
      customer[key as (typeof validInputKeys)[number]] = value
    }
  }

  // update customer and possibly password
  const { data, errors } = await customerAccount.mutate(CUSTOMER_UPDATE_MUTATION, {
    variables: {
      customer
    }
  })

  if (errors?.length) {
    return json(
      { error: errors[0].message, customer: null },
      {
        status: 400,
        headers: {
          'Set-Cookie': await context.session.commit()
        }
      }
    )
  }

  return json(
    {
      error: null,
      customer: data?.customerUpdate?.customer
    },
    {
      headers: {
        'Set-Cookie': await context.session.commit()
      }
    }
  )
}

export default function AccountProfile() {
  const account = useOutletContext<{ customer: CustomerFragment }>()
  const { state } = useNavigation()
  const action = useActionData<ActionResponse>()
  const customer = action?.customer ?? account?.customer

  return (
    <div className="account-profile">
      <Form method="PUT">
        <Stack mb={32}>
          <TextInput
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            placeholder="First Name"
            aria-label="First name"
            defaultValue={customer.firstName ?? ''}
            minLength={2}
            size="md"
          />
          <TextInput
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            placeholder="Last Name"
            aria-label="Last name"
            defaultValue={customer.lastName ?? ''}
            minLength={2}
            size="md"
          />
          <TextInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Email"
            aria-label="Email"
            defaultValue={customer.emailAddress?.emailAddress ?? ''}
            minLength={2}
            size="md"
            disabled
          />
        </Stack>
        {action?.error && <Alert icon={<MdErrorOutline size="100%" />} color="red" title={action.error} mb={32} />}
        <Button
          type="submit"
          disabled={state !== 'idle'}
          loaderProps={{ type: 'dots' }}
          loading={state !== 'idle'}
          fullWidth
          size="md"
          mb="md"
        >
          SAVE CHANGES
        </Button>
      </Form>
      <Logout />
    </div>
  )
}

function Logout() {
  const { state } = useNavigation()

  return (
    <Form className="account-logout" method="POST" action="/account/logout">
      <Button
        variant="outline"
        type="submit"
        disabled={state !== 'idle'}
        loaderProps={{ type: 'dots' }}
        loading={state !== 'idle'}
        fullWidth
        size="md"
      >
        LOG OUT
      </Button>
    </Form>
  )
}
