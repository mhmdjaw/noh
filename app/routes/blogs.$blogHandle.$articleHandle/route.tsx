import { json, type LoaderFunctionArgs } from '@shopify/remix-oxygen'
import { Link, useLoaderData, type MetaFunction } from '@remix-run/react'
import { Image } from '@shopify/hydrogen'
import { Button, Center, Container, Text, Title } from '@mantine/core'
import styles from './blogs.$blogHandle.$articleHandle.module.css'
import { FiUpload } from 'react-icons/fi'
import { BiArrowBack } from 'react-icons/bi'

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: `NOH | ${data?.article.title ?? ''}` }]
}

export async function loader({ params, context }: LoaderFunctionArgs) {
  const { blogHandle, articleHandle } = params

  if (!articleHandle || !blogHandle) {
    throw new Response('Not found', { status: 404 })
  }

  const { blog } = await context.storefront.query(ARTICLE_QUERY, {
    variables: { blogHandle, articleHandle }
  })

  if (!blog?.articleByHandle) {
    throw new Response(null, { status: 404 })
  }

  const article = blog.articleByHandle

  return json({ article })
}

export default function Article() {
  const { article } = useLoaderData<typeof loader>()
  const { title, image, contentHtml, handle, blog } = article

  const publishedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(article.publishedAt))

  async function share() {
    const shareData = {
      title: 'NOH',
      text: title,
      url: handle
    }
    try {
      await navigator.share(shareData)
    } catch (err) {}
  }

  return (
    <Container size="xl" p={0}>
      {image && <Image className={styles.articleImage} data={image} width="100%" loading="eager" />}
      <Container size="sm" py={{ base: 26, xs: 40 }}>
        <Title order={1} size={42} fw="var(--mantine-fw-b)" mb={16}>
          {title}
        </Title>
        <Text mb={26}>
          <small>{publishedDate}</small>
        </Text>
        <Button variant="subtle" size="compact-md" leftSection={<FiUpload />} onClick={share} mb={12}>
          Share
        </Button>
        <div dangerouslySetInnerHTML={{ __html: contentHtml }} className="html-content" />
        <Center mt={{ base: 26, xs: 40 }}>
          <Button
            component={Link}
            to={`/blogs/${blog.handle}`}
            variant="outline"
            color="black"
            size="md"
            leftSection={<BiArrowBack />}
          >
            Back to journal
          </Button>
        </Center>
      </Container>
    </Container>
  )
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog#field-blog-articlebyhandle
const ARTICLE_QUERY = `#graphql
  query Article(
    $articleHandle: String!
    $blogHandle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    blog(handle: $blogHandle) {
      articleByHandle(handle: $articleHandle) {
        title
        contentHtml
        publishedAt
        handle
        author: authorV2 {
          name
        }
        image {
          id
          altText
          url
          width
          height
        }
        blog {
          handle
        }
        seo {
          description
          title
        }
      }
    }
  }
` as const
