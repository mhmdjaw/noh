import { Anchor, Button, Grid, Group, Stack, Text } from '@mantine/core'
import { Link } from '@remix-run/react'
import type { FooterQuery, HeaderQuery } from 'storefrontapi.generated'
import { useRootLoaderData } from '~/root'
import styles from './Footer.module.css'

export function Footer({ menu, shop }: FooterQuery & { shop: HeaderQuery['shop'] }) {
  return (
    <footer>{shop?.primaryDomain?.url && <FooterMenu menu={menu} primaryDomainUrl={shop.primaryDomain.url} />}</footer>
  )
}

function FooterMenu({
  menu,
  primaryDomainUrl
}: {
  menu: FooterQuery['menu']
  primaryDomainUrl: HeaderQuery['shop']['primaryDomain']['url']
}) {
  return (
    <nav role="navigation">
      {/* {FALLBACK_CUSTOMER_CARE_MENU.items.map((item) => {
        if (!item.url) return null
        // if the url is internal, we strip the domain
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url
        const isExternal = !url.startsWith('/')
        return isExternal ? (
          <a href={url} key={item.id} rel="noopener noreferrer" target="_blank">
            {item.title}
          </a>
        ) : (
          <NavLink end key={item.id} prefetch="intent" to={url}>
            {item.title}
          </NavLink>
        )
      })} */}
      <Stack p={40}>
        <Group justify="center" align="flex-start">
          <Grid gutter={8} flex="1 1 auto">
            <Grid.Col span={{ base: 6, sm: 3, xl: 2 }} order={{ base: 3, sm: 1 }} pt={{ base: 32, sm: 4 }}>
              <Stack align="flex-start">
                <Text c="var(--mantine-color-gray-text)" fw="var(--mantine-fw-sb)" size="lg">
                  About
                </Text>
                <FooterSubMenu menu={FALLBACK_ABOUT_MENU} primaryDomainUrl={primaryDomainUrl} />
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 4, xl: 3 }} order={{ base: 1, sm: 2 }}>
              <Stack align="flex-start">
                <Text c="var(--mantine-color-gray-text)" fw="var(--mantine-fw-sb)" size="lg">
                  Customer Care
                </Text>
                <FooterSubMenu menu={FALLBACK_CUSTOMER_CARE_MENU} primaryDomainUrl={primaryDomainUrl} />
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 4, xl: 3 }} order={{ base: 2, sm: 3 }} pl={{ base: 32, sm: 4 }}>
              <Stack align="flex-start">
                <Text c="var(--mantine-color-gray-text)" fw="var(--mantine-fw-sb)" size="lg">
                  Socials
                </Text>
                <FooterSubMenu menu={FALLBACK_SOCIALS_MENU} primaryDomainUrl={primaryDomainUrl} />
              </Stack>
            </Grid.Col>
          </Grid>
          <Button className={styles.newsLetterButton} variant="outline" color="black">
            subscribe to our news letter
          </Button>
        </Group>
        <Group className={styles.policiesMenu}>
          <FooterSubMenu
            menu={FALLBACK_POLICIES_MENU}
            primaryDomainUrl={primaryDomainUrl}
            color="var(--mantine-color-gray-text)"
          />
          <Anchor fw="var(--mantine-fw-sb)" size="lg" c="var(--mantine-color-gray-text)">
            Credits
          </Anchor>
        </Group>
      </Stack>
    </nav>
  )
}

function FooterSubMenu({
  menu,
  primaryDomainUrl,
  color
}: {
  menu: {
    id: string
    items: {
      id: string
      resourceId: string | null
      tags: never[]
      title: string
      type: string
      url: string
      items: never[]
    }[]
  }
  primaryDomainUrl: HeaderQuery['shop']['primaryDomain']['url']
  color?: string
}) {
  const { publicStoreDomain } = useRootLoaderData()

  return menu!.items.map((item) => {
    if (!item.url) return null
    // if the url is internal, we strip the domain
    const url =
      item.url.includes('myshopify.com') || item.url.includes(publicStoreDomain) || item.url.includes(primaryDomainUrl)
        ? new URL(item.url).pathname
        : item.url
    const isExternal = !url.startsWith('/')
    return isExternal ? (
      <Anchor
        component="a"
        href={url}
        key={item.id}
        rel="noopener noreferrer"
        target="_blank"
        fw="var(--mantine-fw-sb)"
        size="lg"
        c={color}
      >
        {item.title}
      </Anchor>
    ) : (
      <Anchor component={Link} key={item.id} prefetch="intent" to={url} fw="var(--mantine-fw-sb)" size="lg" c={color}>
        {item.title}
      </Anchor>
    )
  })
}

const FALLBACK_ABOUT_MENU = {
  id: 'gid://shopify/Menu/199655620675',
  items: [
    {
      id: 'gid://shopify/MenuItem/461633060810',
      resourceId: 'gid://shopify/ShopAbout/23357456264',
      tags: [],
      title: 'Our Story',
      type: 'SHOP_ABOUT',
      url: '/pages/about',
      items: []
    }
  ]
}

const FALLBACK_CUSTOMER_CARE_MENU = {
  id: 'gid://shopify/Menu/199633620675',
  items: [
    {
      id: 'gid://shopify/MenuItem/461633093688',
      resourceId: 'gid://shopify/ShopCustomer/23358013496',
      tags: [],
      title: 'Contact',
      type: 'CUSTOMER_CARE',
      url: '/pages/contact',
      items: []
    },
    {
      id: 'gid://shopify/MenuItem/461633083188',
      resourceId: 'gid://shopify/ShopCustomer/24488013496',
      tags: [],
      title: 'FAQs',
      type: 'CUSTOMER_CARE',
      url: '/pages/faq',
      items: []
    },
    {
      id: 'gid://shopify/MenuItem/461633126456',
      resourceId: 'gid://shopify/ShopCustomer/23358111800',
      tags: [],
      title: 'Shipping & Returns',
      type: 'CUSTOMER_CARE',
      url: '/pages/shipping-and-returns',
      items: []
    }
  ]
}

const FALLBACK_SOCIALS_MENU = {
  id: 'gid://shopify/Menu/111255620664',
  items: [
    {
      id: 'gid://shopify/MenuItem/461323060920',
      resourceId: null,
      tags: [],
      title: 'Instagram',
      type: 'SHOP_SOCIALS',
      url: 'https://www.linkedin.com/company/noh-eyewear',
      items: []
    },
    {
      id: 'gid://shopify/MenuItem/461633159224',
      resourceId: null,
      tags: [],
      title: 'Facebook',
      type: 'SHOP_SOCIALS',
      url: 'https://www.linkedin.com/company/noh-eyewear',
      items: []
    }
  ]
}

const FALLBACK_POLICIES_MENU = {
  id: 'gid://shopify/Menu/199655620664',
  items: [
    {
      id: 'gid://shopify/MenuItem/461633060920',
      resourceId: 'gid://shopify/ShopPolicy/23358046264',
      tags: [],
      title: 'Privacy Policy',
      type: 'SHOP_POLICY',
      url: '/policies/privacy-policy',
      items: []
    },
    {
      id: 'gid://shopify/MenuItem/461633159224',
      resourceId: 'gid://shopify/ShopPolicy/23358079032',
      tags: [],
      title: 'Terms of Service',
      type: 'SHOP_POLICY',
      url: '/policies/terms-of-service',
      items: []
    }
  ]
}
