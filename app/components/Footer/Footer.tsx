import { Anchor, Button, FocusTrap, Grid, Group, Modal, Stack, Text } from '@mantine/core'
import { Link } from '@remix-run/react'
import type { FooterQuery, HeaderQuery } from 'storefrontapi.generated'
import { useRootLoaderData } from '~/root'
import styles from './Footer.module.css'
import { openNewsLetter } from '../NewsLetter'
import { useDisclosure } from '@mantine/hooks'

export function Footer({ menu, shop }: FooterQuery & { shop: HeaderQuery['shop'] }) {
  return (
    <footer className={styles.footer}>
      {shop?.primaryDomain?.url && <FooterMenu menu={menu} primaryDomainUrl={shop.primaryDomain.url} />}
    </footer>
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
      <Stack p={{ base: 26, sm: 40 }} pb={20}>
        <Group justify="center" align="flex-start">
          <Grid gutter={8} flex="1 1 auto">
            <Grid.Col span={{ base: 6, sm: 3, xl: 2 }} order={{ base: 3, sm: 3 }} pt={{ base: 32, sm: 4 }}>
              <Stack align="flex-start">
                <Text c="var(--mantine-color-gray-text)" fw="var(--mantine-fw-sb)" size="lg">
                  About
                </Text>
                <Stack gap={8}>
                  <FooterSubMenu menu={FALLBACK_ABOUT_MENU} primaryDomainUrl={primaryDomainUrl} />
                </Stack>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 4, xl: 3 }} order={{ base: 1, sm: 1 }}>
              <Stack align="flex-start">
                <Text c="var(--mantine-color-gray-text)" fw="var(--mantine-fw-sb)" size="lg">
                  Customer Care
                </Text>
                <Stack gap={8}>
                  <FooterSubMenu menu={FALLBACK_CUSTOMER_CARE_MENU} primaryDomainUrl={primaryDomainUrl} />
                </Stack>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 4, xl: 3 }} order={{ base: 2, sm: 2 }} pl={{ base: 32, sm: 4 }}>
              <Stack align="flex-start">
                <Text c="var(--mantine-color-gray-text)" fw="var(--mantine-fw-sb)" size="lg">
                  Socials
                </Text>
                <Stack gap={8}>
                  <FooterSubMenu menu={FALLBACK_SOCIALS_MENU} primaryDomainUrl={primaryDomainUrl} />
                </Stack>
              </Stack>
            </Grid.Col>
          </Grid>
          <Button className={styles.newsLetterButton} variant="outline" color="black" onClick={openNewsLetter}>
            subscribe to our newsletter
          </Button>
        </Group>
        <Group className={styles.policiesMenu}>
          <FooterSubMenu
            menu={FALLBACK_POLICIES_MENU}
            primaryDomainUrl={primaryDomainUrl}
            color="var(--mantine-color-gray-text)"
          />
          <Credits />
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

function Credits() {
  const [opened, { open, close }] = useDisclosure(false)

  return (
    <>
      <Anchor fw="var(--mantine-fw-sb)" size="lg" c="var(--mantine-color-gray-text)" onClick={open}>
        Credits
      </Anchor>
      <Modal
        opened={opened}
        onClose={close}
        title="Site Credits"
        centered
        zIndex={99999}
        classNames={{ title: styles.creditsTitle, content: styles.creditsContent }}
        autoFocus={false}
      >
        <FocusTrap.InitialFocus />
        <Stack>
          {SITE_CREDITS.map((credit) => (
            <Group key={credit.specialty} justify="space-between">
              <Text fw="var(--mantine-fw-md)">{credit.specialty}</Text>
              <Anchor fw="var(--mantine-fw-md)" href={credit.url}>
                {credit.name}
              </Anchor>
            </Group>
          ))}
        </Stack>
      </Modal>
    </>
  )
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
      url: '/pages/frequently-asked-questions',
      items: []
    },
    {
      id: 'gid://shopify/MenuItem/461633126456',
      resourceId: 'gid://shopify/ShopCustomer/23358111800',
      tags: [],
      title: 'Returns & Refunds',
      type: 'CUSTOMER_CARE',
      url: '/policies/refund-policy',
      items: []
    },
    {
      id: 'gid://shopify/MenuItem/466293126456',
      resourceId: 'gid://shopify/ShopCustomer/23363411800',
      tags: [],
      title: 'Shipping Policy',
      type: 'CUSTOMER_CARE',
      url: '/policies/shipping-policy',
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
      url: 'https://www.instagram.com/noheyewear/?igsh=MW15YTdsdWVqMWxj',
      items: []
    },
    {
      id: 'gid://shopify/MenuItem/461633159224',
      resourceId: null,
      tags: [],
      title: 'Facebook',
      type: 'SHOP_SOCIALS',
      url: 'https://www.instagram.com/noheyewear/?igsh=MW15YTdsdWVqMWxj',
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

const SITE_CREDITS = [
  {
    specialty: 'Development',
    name: 'Mohamad Jawhar',
    url: 'https://www.linkedin.com/in/mohamadjawhar/'
  },
  {
    specialty: 'Digital Design',
    name: 'Omar Kreidly',
    url: 'https://www.linkedin.com/in/omarkreidly/'
  }
]
