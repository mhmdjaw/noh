import { defer, type LoaderFunctionArgs } from '@shopify/remix-oxygen'
import { Await, useLoaderData, Link, type MetaFunction } from '@remix-run/react'
import { Suspense } from 'react'
import { Image, Money } from '@shopify/hydrogen'
import { BsEyeglasses } from 'react-icons/bs'
import type { FeaturedCollectionFragment, RecommendedProductsQuery } from 'storefrontapi.generated'
import styles from './_index.module.css'
import { rem } from '@mantine/core'

export const meta: MetaFunction = () => {
  return [{ title: 'NOH | Home' }]
}

export async function loader({ context }: LoaderFunctionArgs) {
  const { storefront } = context
  const { collections } = await storefront.query(FEATURED_COLLECTION_QUERY)
  const featuredCollection = collections.nodes[0]
  const recommendedProducts = storefront.query(RECOMMENDED_PRODUCTS_QUERY)

  return defer({ featuredCollection, recommendedProducts })
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>()
  return (
    <div className="home">
      <FeaturedCollection collection={data.featuredCollection} />
      <RecommendedProducts products={data.recommendedProducts} />
    </div>
  )
}

function FeaturedCollection({ collection }: { collection: FeaturedCollectionFragment }) {
  if (!collection) return null
  const image = collection?.image
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
        <video className="media" autoPlay loop muted playsInline src="/noh-video.mp4"></video>
      </div>
      <div className={styles.heroSectionContent}>
        <Link className={`${styles.roundedText} ${styles.rotating}`} prefetch="intent" to="/collections">
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
        <BsEyeglasses size="7rem" color="var(--mantine-color-body)" />
      </div>
    </div>
  )
}

function RecommendedProducts({ products }: { products: Promise<RecommendedProductsQuery> }) {
  return (
    <div className="recommended-products">
      <h2>Recommended Products</h2>
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {({ products }) => (
            <div className="recommended-products-grid">
              {products.nodes.map((product) => (
                <Link key={product.id} className="recommended-product" to={`/products/${product.handle}`}>
                  <Image data={product.images.nodes[0]} aspectRatio="1/1" sizes="(min-width: 45em) 20vw, 50vw" />
                  <h4>{product.title}</h4>
                  <small>
                    <Money data={product.priceRange.minVariantPrice} />
                  </small>
                </Link>
              ))}
            </div>
          )}
        </Await>
      </Suspense>
      <br />
    </div>
  )
}

const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
` as const

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    images(first: 1) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const
