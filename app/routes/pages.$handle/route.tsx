import { defer, json, type LoaderFunctionArgs } from '@shopify/remix-oxygen'
import { Await, useLoaderData, type MetaFunction } from '@remix-run/react'
import { Container, Grid, Title } from '@mantine/core'
import styles from './pages.$handle.module.css'
import { Image } from '@shopify/hydrogen'

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: `NOH | ${data?.page.title ?? ''}` }]
}

export async function loader({ params, context }: LoaderFunctionArgs) {
  if (!params.handle) {
    throw new Error('Missing page handle')
  }

  const { page } = await context.storefront.query(PAGE_QUERY, {
    variables: {
      handle: params.handle
    }
  })

  if (!page) {
    throw new Response('Not Found', { status: 404 })
  }

  if (page.title === 'About') {
    const aboutCollection = context.storefront.query(ABOUT_QUERY, {
      variables: { handle: 'about', first: 2 }
    })

    return defer({ page, aboutCollection })
  } else {
    return defer({ page, aboutCollection: null })
  }
}

export default function Page() {
  const { page, aboutCollection } = useLoaderData<typeof loader>()

  if (page.title === 'About') {
    return (
      <Grid gutter={0}>
        <Grid.Col span={{ base: 12, sm: 6 }} order={{ base: 2, sm: 1 }}>
          <Container size="xs" py={{ base: 26, xs: 40 }}>
            <header>
              <Title
                order={1}
                size={50}
                fw="var(--mantine-fw-b)"
                mb={{ base: 16, sm: 40 }}
                ta={{ base: 'left', sm: 'center' }}
              >
                {page.title}
              </Title>
            </header>
            <main className="html-content" dangerouslySetInnerHTML={{ __html: page.body }} />
          </Container>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6 }} order={{ base: 1, sm: 2 }}>
          <div className={styles.aboutImage}>
            {aboutCollection && (
              <Await resolve={aboutCollection}>
                {({ collection }) =>
                  collection && (
                    <Image data={collection.products.nodes[0].images.nodes[1]} width="100%" loading="eager" />
                  )
                }
              </Await>
            )}
          </div>
        </Grid.Col>
      </Grid>
    )
  }

  return (
    <Container size="sm" py={{ base: 26, xs: 40 }}>
      <header>
        <Title order={1} size={50} fw="var(--mantine-fw-b)" mb={16}>
          {page.title}
        </Title>
      </header>
      <main className="html-content" dangerouslySetInnerHTML={{ __html: page.body }} />
    </Container>
  )
}

const PAGE_QUERY = `#graphql
  query Page(
    $language: LanguageCode,
    $country: CountryCode,
    $handle: String!
  )
  @inContext(language: $language, country: $country) {
    page(handle: $handle) {
      id
      title
      body
      seo {
        description
        title
      }
    }
  }
` as const

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const ABOUT_QUERY = `#graphql
  query AboutProducts(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          images(first: 2) {
            nodes {
              id
              altText
              url
              width
              height
            }
          }
        }
      }
    }
  }
` as const
