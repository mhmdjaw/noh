import { defer, type LoaderFunctionArgs } from '@shopify/remix-oxygen'
import { Await, useLoaderData, Link, type MetaFunction } from '@remix-run/react'
import { Suspense } from 'react'
import { Image } from '@shopify/hydrogen'
import { BsEyeglasses } from 'react-icons/bs'
import type { FeaturedProductFragment } from 'storefrontapi.generated'
import { ActionIcon, Anchor, Button, Grid, Group, Overlay, Stack, Title, rem } from '@mantine/core'
import { FaInstagram, FaFacebook } from 'react-icons/fa'
import styles from './_index.module.css'

export const meta: MetaFunction = () => {
  return [{ title: 'NOH | Home' }]
}

export async function loader({ context }: LoaderFunctionArgs) {
  const { storefront } = context
  const featuredCollection = storefront.query(FEATURED_QUERY, {
    variables: { handle: 'featured', first: 2 }
  })

  return defer({ featuredCollection })
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>()

  return (
    <div className="home">
      <Hero />
      <Suspense fallback={<></>}>
        <Await resolve={data.featuredCollection}>
          {({ collection }) => collection && <Featured products={collection.products.nodes} />}
        </Await>
      </Suspense>
      <Slogan />
      <ShopAll />
      <Socials />
    </div>
  )
}

function Hero() {
  return (
    <div className={styles.heroSection}>
      <div className={styles.heroSectionImage}>
        {/* <Image
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center center'
          }}
          data={{ url: 'http://localhost:3000/drone-site-small-image.jpg' }}
          sizes="100vw"
        /> */}
        <div className="media" />
        <video className="media" autoPlay loop muted playsInline src="/test-footage.mp4"></video>
      </div>
      <div className={styles.heroSectionContent}>
        <Link className={`${styles.roundedText} ${styles.rotating}`} prefetch="intent" to="/collections/shop-all">
          <svg viewBox="0 0 230 230">
            <path
              id="textPath"
              d="M 85,0 A 85,85 0 0 1 -85,0 A 85,85 0 0 1 85,0"
              transform="translate(115,115)"
              fill="none"
            ></path>
            <g fontSize={rem(26)}>
              <text textAnchor="start">
                <textPath fill="var(--mantine-color-body)" xlinkHref="#textPath" startOffset="0%">
                  discover now . discover now . discover now .{' '}
                </textPath>
              </text>
            </g>
          </svg>
        </Link>
      </div>
      <div className={styles.heroSectionContent}>
        <BsEyeglasses size="5rem" color="var(--mantine-color-body)" />
      </div>
    </div>
  )
}

function Featured({ products }: { products: FeaturedProductFragment[] }) {
  return (
    <Grid gutter={0}>
      {products.map(({ id, title, images, handle }) => (
        <Grid.Col key={id} span={{ base: 12, xs: 6 }} className={styles.featuredImageColumn}>
          <Anchor component={Link} to={`/products/${handle}`} prefetch="intent" className={styles.featuredProduct}>
            <Image alt={images.nodes[1].altText || 'product image'} data={images.nodes[1]} />
            <div className={styles.featuredProductContent}>
              <Title order={1} fz={{ base: 36, md: 42, lg: 64 }}>
                {title}
              </Title>
              <Button
                component={Link}
                prefetch="intent"
                to={`/products/${handle}`}
                variant="outline"
                color="white"
                size="lg"
                hiddenFrom="md"
              >
                Shop Now
              </Button>
              <Button
                component={Link}
                prefetch="intent"
                to={`/products/${handle}`}
                variant="outline"
                color="white"
                size="xl"
                visibleFrom="md"
              >
                Shop Now
              </Button>
            </div>
          </Anchor>
        </Grid.Col>
      ))}
    </Grid>
  )
}

function Slogan() {
  return (
    <Title className={styles.slogan} order={1}>
      envision <span className={styles.blur}>bespoke</span> excellence
    </Title>
  )
}

function ShopAll() {
  return (
    <Group justify="center" pb={40}>
      <div className={styles.shopAllImage}>
        <Image
          alt="shop all"
          data={{ url: 'https://cdn.shopify.com/s/files/1/0655/4710/8520/files/eye_glasses_shop_all.jpg?v=1714172670' }}
          width="100%"
        />
        <Overlay
          className={styles.shopAllOverlay}
          gradient="linear-gradient(180deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0) 100%)"
          zIndex={10}
        >
          <Anchor className={styles.shopAllLink} prefetch="intent" component={Link} to="/collections/shop-all" />
          <Button
            component={Link}
            prefetch="intent"
            to="/collections/shop-all"
            variant="outline"
            color="white"
            size="xl"
            visibleFrom="sm"
          >
            VIEW OUR COLLECTION
          </Button>
          <Button
            component={Link}
            prefetch="intent"
            to="/collections/shop-all"
            variant="outline"
            color="white"
            size="lg"
            hiddenFrom="sm"
          >
            VIEW OUR COLLECTION
          </Button>
        </Overlay>
      </div>
    </Group>
  )
}

function Socials() {
  return (
    <div className={styles.socials}>
      <Stack py={15} pl={7} gap={12}>
        <ActionIcon
          component="a"
          variant="transparent"
          size="xl"
          href="https://www.instagram.com/noheyewear/?igsh=MW15YTdsdWVqMWxj"
        >
          <FaInstagram size="70%" />
        </ActionIcon>
        <ActionIcon
          component="a"
          variant="transparent"
          size="xl"
          href="https://www.instagram.com/noheyewear/?igsh=MW15YTdsdWVqMWxj"
        >
          <FaFacebook size="70%" />
        </ActionIcon>
      </Stack>
    </div>
  )
}

const FEATURED_PRODUCT_FRAGMENT = `#graphql
  fragment FeaturedProduct on Product {
    id
    handle
    title
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
` as const

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const FEATURED_QUERY = `#graphql
  ${FEATURED_PRODUCT_FRAGMENT}
  query FeaturedProducts(
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
          ...FeaturedProduct
        }
      }
    }
  }
` as const
