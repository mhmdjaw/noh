import { json, type LoaderFunctionArgs } from '@shopify/remix-oxygen'
import { Link, useLoaderData, useNavigate, type MetaFunction } from '@remix-run/react'
import { Image, Pagination, getPaginationVariables } from '@shopify/hydrogen'
import type { ArticleItemFragment } from 'storefrontapi.generated'
import { Anchor, Center, Container, Grid, LoadingOverlay, Stack, Text, Title } from '@mantine/core'
import styles from './blogs.$blogHandle._index.module.css'
import { useEffect } from 'react'
import { useInViewport } from '@mantine/hooks'

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: `NOH | ${data?.blog.title ?? ''}` }]
}

export const loader = async ({ request, params, context: { storefront } }: LoaderFunctionArgs) => {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 6
  })

  if (!params.blogHandle) {
    throw new Response(`blog not found`, { status: 404 })
  }

  const { blog } = await storefront.query(BLOGS_QUERY, {
    variables: {
      blogHandle: params.blogHandle,
      ...paginationVariables
    }
  })

  if (!blog?.articles) {
    throw new Response('Not found', { status: 404 })
  }

  return json({ blog })
}

export default function Blog() {
  const { blog } = useLoaderData<typeof loader>()
  const { articles } = blog

  const { ref: refNext, inViewport: inViewportNext } = useInViewport()
  const { ref: refPrev, inViewport: inViewportPrev } = useInViewport()

  return (
    <Container size="lg" py={{ base: 26, xs: 40 }}>
      <Pagination connection={articles}>
        {({
          nodes,
          isLoading,
          PreviousLink,
          NextLink,
          state,
          nextPageUrl,
          hasNextPage,
          previousPageUrl,
          hasPreviousPage
        }) => {
          return (
            <>
              <PreviousLink ref={refPrev}>{<Loading visible={isLoading} />}</PreviousLink>
              <ArticlesGird
                articles={nodes}
                inViewNext={inViewportNext}
                hasNextPage={hasNextPage}
                nextPageUrl={nextPageUrl}
                inViewPrev={inViewportPrev}
                hasPreviousPage={hasPreviousPage}
                previousPageUrl={previousPageUrl}
                state={state}
              />
              <NextLink ref={refNext}>{<Loading visible={isLoading} />}</NextLink>
            </>
          )
        }}
      </Pagination>
    </Container>
  )
}

function ArticlesGird({
  articles,
  inViewNext,
  hasNextPage,
  nextPageUrl,
  inViewPrev,
  hasPreviousPage,
  previousPageUrl,
  state
}: {
  articles: ArticleItemFragment[]
  inViewNext: boolean
  hasNextPage: boolean
  nextPageUrl: string
  inViewPrev: boolean
  hasPreviousPage: boolean
  previousPageUrl: string
  state: any
}) {
  const navigate = useNavigate()

  useEffect(() => {
    if (inViewNext && hasNextPage) {
      navigate(nextPageUrl, {
        replace: true,
        preventScrollReset: true,
        state
      })
    }
  }, [inViewNext, navigate, state, nextPageUrl, hasNextPage])

  useEffect(() => {
    if (inViewPrev && hasPreviousPage) {
      navigate(previousPageUrl, {
        replace: true,
        preventScrollReset: true,
        state
      })
    }
  }, [inViewPrev, navigate, state, previousPageUrl, hasPreviousPage])

  return (
    <Grid gutter="xl">
      {articles.map((article, index) => {
        return <ArticleItem article={article} key={article.id} loading={index < 6 ? 'eager' : 'lazy'} />
      })}
    </Grid>
  )
}

function ArticleItem({ article, loading }: { article: ArticleItemFragment; loading?: HTMLImageElement['loading'] }) {
  const publishedAt = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(article.publishedAt!))
  return (
    <Grid.Col span={{ base: 12, xs: 6 }} key={article.id}>
      <Anchor className={styles.articleLink} component={Link} to={`/blogs/${article.blog.handle}/${article.handle}`}>
        <Stack gap={8}>
          {article.image && (
            <div className={styles.articleImageContainer}>
              <Image
                className={styles.articleImage}
                alt={article.image.altText || article.title}
                data={article.image}
                loading={loading}
                width="100%"
              />
            </div>
          )}
          <Title order={2} mt={{ base: 10, xs: 20 }}>
            {article.title}
          </Title>
          <Text>
            <small>{publishedAt}</small>
          </Text>
          <Text size="lg" c="var(--mantine-color-gray-text)">
            {article.excerpt}
          </Text>
        </Stack>
      </Anchor>
    </Grid.Col>
  )
}

function Loading({ visible }: { visible: boolean }) {
  return (
    <Center pos="relative" mih={40} my={40}>
      <LoadingOverlay visible={visible} zIndex={0} overlayProps={{ blur: 0 }} loaderProps={{ type: 'dots' }} />
    </Center>
  )
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog
const BLOGS_QUERY = `#graphql
  query Blog(
    $language: LanguageCode
    $blogHandle: String!
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(language: $language) {
    blog(handle: $blogHandle) {
      title
      seo {
        title
        description
      }
      articles(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        sortKey: UPDATED_AT,
        reverse:  true
      ) {
        nodes {
          ...ArticleItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          hasNextPage
          endCursor
          startCursor
        }

      }
    }
  }
  fragment ArticleItem on Article {
    author: authorV2 {
      name
    }
    contentHtml
    excerpt
    handle
    id
    image {
      id
      altText
      url
      width
      height
    }
    publishedAt
    title
    blog {
      handle
    }
  }
` as const
