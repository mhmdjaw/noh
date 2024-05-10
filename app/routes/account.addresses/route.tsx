import type { CustomerAddressInput } from '@shopify/hydrogen/customer-account-api-types'
import type { AddressFragment, CustomerFragment } from 'customer-accountapi.generated'
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@shopify/remix-oxygen'
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
  useOutletContext,
  type MetaFunction
} from '@remix-run/react'
import {
  UPDATE_ADDRESS_MUTATION,
  DELETE_ADDRESS_MUTATION,
  CREATE_ADDRESS_MUTATION
} from '~/graphql/customer-account/CustomerAddressMutations'
import {
  Alert,
  Anchor,
  Button,
  Checkbox,
  Divider,
  Grid,
  Group,
  NativeSelect,
  Stack,
  Text,
  TextInput,
  Title
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import styles from './account.addresses.module.css'
import { countries } from '~/lib/country-codes'
import { type AppLoadContext } from '@remix-run/server-runtime'
import { MdErrorOutline } from 'react-icons/md'
import { Fragment } from 'react/jsx-runtime'
import cx from 'clsx'

export type ActionResponse = {
  addressId?: string | null
  createdAddress?: AddressFragment
  defaultAddress?: string | null
  deletedAddress?: string | null
  error: Record<AddressFragment['id'], string> | null
  updatedAddress?: AddressFragment
}

export const meta: MetaFunction = () => {
  return [{ title: 'Addresses' }]
}

export async function loader({ context }: LoaderFunctionArgs) {
  await context.customerAccount.handleAuthStatus()

  return json(
    { timestamp: Date.now() },
    {
      headers: {
        'Set-Cookie': await context.session.commit()
      }
    }
  )
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { customerAccount } = context

  const form = await request.formData()

  const addressId = form.has('addressId') ? String(form.get('addressId')) : null
  if (!addressId) {
    return await returnError('You must provide an address id.', context)
  }

  // this will ensure redirecting to login never happen for mutation
  const isLoggedIn = await customerAccount.isLoggedIn()
  if (!isLoggedIn) {
    return await returnError({ [addressId]: 'Unauthorized' }, context, 401)
  }

  const defaultAddress = form.has('defaultAddress') ? String(form.get('defaultAddress')) === 'on' : false
  const address: CustomerAddressInput = {}
  const keys: (keyof CustomerAddressInput)[] = [
    'address1',
    'address2',
    'city',
    'company',
    'territoryCode',
    'firstName',
    'lastName',
    'phoneNumber',
    'zoneCode',
    'zip'
  ]

  for (const key of keys) {
    const value = form.get(key)
    if (typeof value === 'string') {
      address[key] = value
    }
  }

  switch (request.method) {
    case 'POST': {
      // handle new address creation
      const { data, errors } = await customerAccount.mutate(CREATE_ADDRESS_MUTATION, {
        variables: { address, defaultAddress }
      })

      if (errors?.length) {
        return await returnError({ [addressId]: errors[0].message }, context)
      }

      if (data?.customerAddressCreate?.userErrors?.length) {
        return await returnError({ [addressId]: data?.customerAddressCreate?.userErrors[0].message }, context)
      }

      if (!data?.customerAddressCreate?.customerAddress) {
        return await returnError({ [addressId]: 'Customer address create failed.' }, context)
      }

      return json(
        {
          error: null,
          createdAddress: data?.customerAddressCreate?.customerAddress,
          defaultAddress
        },
        {
          headers: {
            'Set-Cookie': await context.session.commit()
          }
        }
      )
    }

    case 'PUT': {
      // handle address updates
      const { data, errors } = await customerAccount.mutate(UPDATE_ADDRESS_MUTATION, {
        variables: {
          address,
          addressId: decodeURIComponent(addressId),
          defaultAddress: defaultAddress ? true : null
        }
      })

      if (errors?.length) {
        return await returnError({ [addressId]: errors[0].message }, context)
      }

      if (data?.customerAddressUpdate?.userErrors?.length) {
        return await returnError({ [addressId]: data?.customerAddressUpdate?.userErrors[0].message }, context)
      }

      if (!data?.customerAddressUpdate?.customerAddress) {
        return await returnError({ [addressId]: 'Customer address update failed.' }, context)
      }

      return json(
        {
          error: null,
          updatedAddress: address,
          defaultAddress
        },
        {
          headers: {
            'Set-Cookie': await context.session.commit()
          }
        }
      )
    }

    case 'DELETE': {
      // handles address deletion
      const { data, errors } = await customerAccount.mutate(DELETE_ADDRESS_MUTATION, {
        variables: { addressId: decodeURIComponent(addressId) }
      })

      if (errors?.length) {
        return await returnError({ [addressId]: errors[0].message }, context)
      }

      if (data?.customerAddressDelete?.userErrors?.length) {
        return await returnError({ [addressId]: data?.customerAddressDelete?.userErrors[0].message }, context)
      }

      if (!data?.customerAddressDelete?.deletedAddressId) {
        return await returnError({ [addressId]: 'Customer address delete failed.' }, context)
      }

      return json(
        { error: null, deletedAddress: addressId },
        {
          headers: {
            'Set-Cookie': await context.session.commit()
          }
        }
      )
    }

    default: {
      return await returnError({ [addressId]: 'Method not allowed' }, context, 405)
    }
  }
}

async function returnError(error: any, context: AppLoadContext, status?: number) {
  return json(
    { error },
    {
      status: status || 400,
      headers: {
        'Set-Cookie': await context.session.commit()
      }
    }
  )
}

export default function Addresses() {
  /* refresh the state of the component by using timestamp from loader as a key 
    so that the state refreshes when submitting an action */
  const { timestamp } = useLoaderData<typeof loader>()

  const { customer } = useOutletContext<{ customer: CustomerFragment }>()
  const { defaultAddress, addresses } = customer

  const index = addresses.nodes.findIndex((address) => address.id === defaultAddress?.id)

  if (index !== -1) {
    addresses.nodes.splice(index, 1)
    if (defaultAddress) {
      addresses.nodes.unshift(defaultAddress)
    }
  }

  return (
    <div key={timestamp} className="account-addresses">
      <Stack align="center" gap="xl">
        {!addresses.nodes.length ? (
          <>
            <Text ta="center" fw="var(--mantine-fw-sb)" size="lg">
              You have no saved addresses yet.
            </Text>
            <Divider w="100%" />
          </>
        ) : (
          <ExistingAddresses addresses={addresses} defaultAddress={defaultAddress} />
        )}
        <NewAddressForm fullwidth={!addresses.nodes.length ? false : true} />
      </Stack>
    </div>
  )
}

function NewAddressForm({ fullwidth }: { fullwidth: boolean }) {
  const newAddress = {
    address1: '',
    address2: '',
    city: '',
    company: '',
    territoryCode: '',
    firstName: '',
    id: 'new',
    lastName: '',
    phoneNumber: '',
    zoneCode: '',
    zip: ''
  } as CustomerAddressInput

  const [opened, { close, open }] = useDisclosure()

  return opened ? (
    <div>
      <Title order={2} mb={16}>
        <legend>Add a new address</legend>
      </Title>
      <AddressForm addressId={'NEW_ADDRESS_ID'} address={newAddress} isDefaultAddress={false}>
        {({ stateForMethod }) => (
          <>
            <Button
              size="md"
              loaderProps={{ type: 'dots' }}
              loading={stateForMethod('POST') !== 'idle'}
              formMethod="POST"
              type="submit"
            >
              SAVE CHANGES
            </Button>
            <Button
              variant="outline"
              size="md"
              loaderProps={{ type: 'dots' }}
              loading={stateForMethod('POST') !== 'idle'}
              onClick={close}
            >
              CANCEL
            </Button>
          </>
        )}
      </AddressForm>
    </div>
  ) : (
    <Button variant="outline" color="black" fullWidth={fullwidth} size="md" onClick={open}>
      ADD A NEW ADDRESS
    </Button>
  )
}

function ExistingAddresses({ addresses, defaultAddress }: Pick<CustomerFragment, 'addresses' | 'defaultAddress'>) {
  return addresses.nodes.map((address, i) => (
    <Fragment key={address.id}>
      <div className={styles.existingAddressContainer}>
        <ExistingAddress address={address} isDefaultAddress={address.id === defaultAddress?.id} />
      </div>
      <Divider w="100%" />
    </Fragment>
  ))
}

function ExistingAddress({ address, isDefaultAddress }: { address: AddressFragment; isDefaultAddress: boolean }) {
  const [opened, { close, open }] = useDisclosure()
  const { state, formMethod } = useNavigation()

  const loadingState = formMethod === 'DELETE' ? state : 'idle'

  console.log(loadingState)

  return opened ? (
    <AddressForm addressId={address.id} address={address} isDefaultAddress={isDefaultAddress}>
      {({ stateForMethod }) => (
        <>
          <Button
            size="md"
            loaderProps={{ type: 'dots' }}
            loading={stateForMethod('PUT') !== 'idle'}
            formMethod="PUT"
            type="submit"
          >
            SAVE CHANGES
          </Button>
          <Button
            variant="outline"
            size="md"
            loaderProps={{ type: 'dots' }}
            loading={stateForMethod('PUT') !== 'idle'}
            onClick={close}
          >
            CANCEL
          </Button>
        </>
      )}
    </AddressForm>
  ) : (
    <>
      {isDefaultAddress && (
        <Text mb="md" fw="var(--mantine-fw-sb)">
          Default
        </Text>
      )}
      <Group
        justify="space-between"
        align="stretch"
        className={cx({ [styles.existingAddressRemoving]: loadingState !== 'idle' })}
      >
        <div className={styles.addressOverview}>
          <Text>
            {address.firstName} {address.lastName}
          </Text>
          <Text>
            {address.address1}, {address.address2}
          </Text>
          <Text>
            {address.city}, {address.territoryCode}
          </Text>
        </div>
        <Stack justify="space-between" align="flex-end">
          <Button
            loaderProps={{ type: 'dots' }}
            loading={loadingState !== 'idle'}
            variant="outline"
            color="black"
            onClick={open}
            size="xs"
            className={styles.editButton}
          >
            Edit
          </Button>
          <Form id={address.id}>
            <input type="hidden" name="addressId" defaultValue={address.id} />
            <Anchor
              component="button"
              formMethod="DELETE"
              type="submit"
              c="var(--mantine-color-gray-text)"
              fw="var(--mantine-fw-sb)"
              underline="always"
            >
              Remove
            </Anchor>
          </Form>
        </Stack>
      </Group>
    </>
  )
}

export function AddressForm({
  addressId,
  address,
  isDefaultAddress,
  children
}: {
  addressId: AddressFragment['id']
  address: CustomerAddressInput
  isDefaultAddress: boolean
  children: (props: {
    stateForMethod: (method: 'PUT' | 'POST' | 'DELETE') => ReturnType<typeof useNavigation>['state']
  }) => React.ReactNode
}) {
  const { state, formMethod } = useNavigation()
  const action = useActionData<ActionResponse>()
  const error = action?.error?.[addressId]
  return (
    <Form id={addressId}>
      <input type="hidden" name="addressId" defaultValue={addressId} />
      <Stack>
        <TextInput
          aria-label="First name"
          autoComplete="given-name"
          defaultValue={address?.firstName ?? ''}
          id="firstName"
          name="firstName"
          placeholder="First name*"
          required
          type="text"
          size="md"
        />
        <TextInput
          aria-label="Last name"
          autoComplete="family-name"
          defaultValue={address?.lastName ?? ''}
          id="lastName"
          name="lastName"
          placeholder="Last name*"
          required
          type="text"
          size="md"
        />
        <TextInput
          aria-label="Company"
          autoComplete="organization"
          defaultValue={address?.company ?? ''}
          id="company"
          name="company"
          placeholder="Company"
          type="text"
          size="md"
        />
        <TextInput
          aria-label="Address line 1"
          autoComplete="address-line1"
          defaultValue={address?.address1 ?? ''}
          id="address1"
          name="address1"
          placeholder="Address*"
          required
          type="text"
          size="md"
        />
        <TextInput
          aria-label="Address line 2"
          autoComplete="address-line2"
          defaultValue={address?.address2 ?? ''}
          id="address2"
          name="address2"
          placeholder="Apt/Floor/Suite"
          type="text"
          size="md"
        />
        <TextInput
          aria-label="City"
          autoComplete="address-level2"
          defaultValue={address?.city ?? ''}
          id="city"
          name="city"
          placeholder="City*"
          required
          type="text"
          size="md"
        />
        <Grid>
          <Grid.Col span={6}>
            <TextInput
              aria-label="State/Province"
              autoComplete="address-level1"
              defaultValue={address?.zoneCode ?? ''}
              id="zoneCode"
              name="zoneCode"
              placeholder="State / Province*"
              required
              type="text"
              size="md"
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              aria-label="Zip"
              autoComplete="postal-code"
              defaultValue={address?.zip ?? ''}
              id="zip"
              name="zip"
              placeholder="Zip / Postal Code*"
              required
              type="text"
              size="md"
            />
          </Grid.Col>
        </Grid>
        <NativeSelect
          classNames={{ input: styles.select }}
          aria-label="territoryCode"
          autoComplete="country"
          defaultValue={address?.territoryCode ?? ''}
          id="territoryCode"
          name="territoryCode"
          data={countries}
          required
          size="md"
        />
        <TextInput
          aria-label="Phone Number"
          autoComplete="tel"
          defaultValue={address?.phoneNumber ?? ''}
          id="phoneNumber"
          name="phoneNumber"
          placeholder="+16135551111"
          pattern="^\+?[1-9]\d{3,14}$"
          type="tel"
          size="md"
        />
        <Checkbox
          id="defaultAddress"
          label="Set as default address"
          variant="outline"
          name="defaultAddress"
          defaultChecked={isDefaultAddress}
        />
        {error && <Alert icon={<MdErrorOutline size="100%" />} color="red" title={error} />}
        {children({
          stateForMethod: (method) => (formMethod === method ? state : 'idle')
        })}
      </Stack>
    </Form>
  )
}
