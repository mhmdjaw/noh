/* import mantine styles */
import '@mantine/core/styles.css'

import { useNonce, UNSTABLE_Analytics as Analytics, getShopAnalytics } from '@shopify/hydrogen'
import { defer, type SerializeFrom, type LoaderFunctionArgs, type LinksFunction } from '@shopify/remix-oxygen'
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  LiveReload,
  useMatches,
  useRouteError,
  useLoaderData,
  ScrollRestoration,
  isRouteErrorResponse,
  type ShouldRevalidateFunction
} from '@remix-run/react'
// import type { CustomerAccessToken } from '@shopify/hydrogen/storefront-api-types'
import favicon from '../public/favicon.svg'
import resetStyles from './styles/normalize.css'
import appStyles from './styles/app.css'
import { Layout } from '~/components/Layout'
import { cssBundleHref } from '@remix-run/css-bundle'
import { ColorSchemeScript, MantineProvider } from '@mantine/core'
import theme, { resolver } from './theme'
import { ErrorLayout } from './components/ErrorLayout'

/**
 * This is important to avoid re-fetching root queries on sub-navigations
 */
export const shouldRevalidate: ShouldRevalidateFunction = ({ formMethod, currentUrl, nextUrl }) => {
  // revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== 'GET') {
    return true
  }

  // revalidate when manually revalidating via useRevalidator
  if (currentUrl.toString() === nextUrl.toString()) {
    return true
  }

  return false
}

export const links: LinksFunction = () => {
  return [
    /* Global styles */
    { rel: 'stylesheet', href: resetStyles },
    { rel: 'stylesheet', href: appStyles },
    /* font */
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&display=swap'
    },
    /* CSS bundling */
    ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
    {
      rel: 'preconnect',
      href: 'https://cdn.shopify.com'
    },
    {
      rel: 'preconnect',
      href: 'https://shop.app'
    },
    { rel: 'icon', type: 'image/svg+xml', href: favicon }
  ]
}

/**
 * Access the result of the root loader from a React component.
 */
export const useRootLoaderData = () => {
  const [root] = useMatches()
  return root?.data as SerializeFrom<typeof loader>
}

export async function loader({ context }: LoaderFunctionArgs) {
  const { storefront, customerAccount, cart } = context
  const publicStoreDomain = context.env.PUBLIC_STORE_DOMAIN

  const isLoggedInPromise = customerAccount.isLoggedIn()
  const cartPromise = cart.get()

  // defer the footer query (below the fold)
  const footerPromise = storefront.query(FOOTER_QUERY, {
    cache: storefront.CacheLong(),
    variables: {
      footerMenuHandle: 'footer' // Adjust to your footer menu handle
    }
  })

  // await the header query (above the fold)
  const headerPromise = storefront.query(HEADER_QUERY, {
    cache: storefront.CacheLong(),
    variables: {
      headerMenuHandle: 'main-menu' // Adjust to your header menu handle
    }
  })

  return defer(
    {
      shop: getShopAnalytics({
        storefront: context.storefront,
        publicStorefrontId: context.env.PUBLIC_STOREFRONT_ID
      }),
      consent: {
        checkoutDomain: context.env.PUBLIC_STORE_DOMAIN,
        storefrontAccessToken: context.env.PUBLIC_STOREFRONT_API_TOKEN
      },
      cart: cartPromise,
      footer: footerPromise,
      header: await headerPromise,
      isLoggedIn: isLoggedInPromise,
      publicStoreDomain
    },
    {
      headers: {
        'Set-Cookie': await context.session.commit()
      }
    }
  )
}

export default function App() {
  const nonce = useNonce()
  const data = useLoaderData<typeof loader>()

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
        <ColorSchemeScript />
      </head>
      <body>
        <Analytics.Provider cart={data.cart} shop={data.shop} consent={data.consent}>
          <MantineProvider theme={theme} cssVariablesResolver={resolver} defaultColorScheme="light">
            <Layout {...data}>
              <Outlet />
            </Layout>
          </MantineProvider>
        </Analytics.Provider>
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <LiveReload nonce={nonce} />
      </body>
    </html>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  const rootData = useRootLoaderData()
  const nonce = useNonce()
  let errorMessage = 'Unknown error'
  let errorStatus = 500

  if (isRouteErrorResponse(error)) {
    errorMessage = error?.data?.message ?? error.data
    errorStatus = error.status
  } else if (error instanceof Error) {
    errorMessage = error.message
  }

  if (errorStatus === 404) {
    errorMessage = "Sorry, the page you're looking for does not exist."
  } else {
    errorMessage = 'Something went Wrong... please refresh the page or try again later.'
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <MantineProvider theme={theme} cssVariablesResolver={resolver} defaultColorScheme="light">
          <Layout {...rootData}>
            {/* <div className="route-error">
              <h1>Oops</h1>
              <h2>{errorStatus}</h2>
              {errorMessage && (
                <fieldset>
                  <pre>{errorMessage}</pre>
                </fieldset>
              )}
            </div> */}
            <ErrorLayout message={errorMessage} />
          </Layout>
        </MantineProvider>
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <LiveReload nonce={nonce} />
      </body>
    </html>
  )
}

const MENU_FRAGMENT = `#graphql
  fragment MenuItem on MenuItem {
    id
    resourceId
    tags
    title
    type
    url
  }
  fragment ChildMenuItem on MenuItem {
    ...MenuItem
  }
  fragment ParentMenuItem on MenuItem {
    ...MenuItem
    items {
      ...ChildMenuItem
    }
  }
  fragment Menu on Menu {
    id
    items {
      ...ParentMenuItem
    }
  }
` as const

const HEADER_QUERY = `#graphql
  fragment Shop on Shop {
    id
    name
    description
    primaryDomain {
      url
    }
    brand {
      logo {
        image {
          url
        }
      }
    }
  }
  query Header(
    $country: CountryCode
    $headerMenuHandle: String!
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    shop {
      ...Shop
    }
    menu(handle: $headerMenuHandle) {
      ...Menu
    }
  }
  ${MENU_FRAGMENT}
` as const

const FOOTER_QUERY = `#graphql
  query Footer(
    $country: CountryCode
    $footerMenuHandle: String!
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    menu(handle: $footerMenuHandle) {
      ...Menu
    }
  }
  ${MENU_FRAGMENT}
` as const
