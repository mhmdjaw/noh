import { Await, NavLink, useLocation } from '@remix-run/react'
import { Suspense, useEffect, useState } from 'react'
import type { CartApiQueryFragment, HeaderQuery } from 'storefrontapi.generated'
import { useRootLoaderData } from '~/root'
import type { LayoutProps } from '../Layout'
import {
  ActionIcon,
  Anchor,
  Badge,
  Center,
  CloseButton,
  Group,
  ScrollArea,
  Space,
  Stack,
  Text,
  Title,
  Transition,
  useMantineTheme
} from '@mantine/core'
import { PrimaryLogo } from '~/assets/svg'
import styles from './Header.module.css'
import { HiOutlineShoppingBag, HiOutlineUser } from 'react-icons/hi2'
import { IconContext } from 'react-icons'
import { useClickOutside, useDisclosure, useMediaQuery } from '@mantine/hooks'
import cx from 'clsx'
import { CartMain } from '../Cart'
import { useCartFetchers } from '~/hooks'
import { CartForm } from '@shopify/hydrogen'

type HeaderProps = Pick<LayoutProps, 'header' | 'cart' | 'isLoggedIn'>

export function Header({ header, isLoggedIn, cart }: HeaderProps) {
  const { shop, menu } = header

  return (
    <>
      <header className={styles.header}>
        <HeaderMenu menu={menu} primaryDomainUrl={header.shop.primaryDomain.url} />
        <NavLink prefetch="intent" to="/" end>
          <strong>
            <Center w={{ base: 110, sm: 130 }}>
              <PrimaryLogo width="100%" aria-description={`${shop.name} Logo`} />
            </Center>
          </strong>
        </NavLink>
        <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
      </header>
      <Space h="75px" />
    </>
  )
}

function HeaderMenu({
  menu,
  primaryDomainUrl
}: {
  menu: HeaderProps['header']['menu']
  primaryDomainUrl: HeaderQuery['shop']['primaryDomain']['url']
}) {
  const { publicStoreDomain } = useRootLoaderData()

  const location = useLocation()

  const [opened, { toggle, close }] = useDisclosure()

  useEffect(() => {
    if (opened) close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return (
    <nav className={styles.headerMenuDesktop} role="navigation">
      <button className={cx(styles.burger, { [styles.active]: opened })} onClick={toggle}></button>
      <HeaderMenuMobile menu={menu} primaryDomainUrl={primaryDomainUrl} opened={opened} />
      {FALLBACK_HEADER_MENU.items.map((item) => {
        if (!item.url) return null

        // if the url is internal, we strip the domain
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url
        return (
          <Anchor
            component={NavLink}
            className={styles.headerMenuItem}
            end
            key={item.id}
            prefetch="intent"
            underline="never"
            to={url}
            visibleFrom="sm"
            size="lg"
          >
            {item.title}
          </Anchor>
        )
      })}
    </nav>
  )
}

function HeaderMenuMobile({
  menu,
  primaryDomainUrl,
  opened
}: {
  menu: HeaderProps['header']['menu']
  primaryDomainUrl: HeaderQuery['shop']['primaryDomain']['url']
  opened: boolean
}) {
  const { publicStoreDomain } = useRootLoaderData()

  return (
    <div className={cx(styles.menuDropDown, { [styles.menuDropDownActive]: opened })}>
      <Stack gap={48}>
        {FALLBACK_HEADER_MENU.items.map((item) => {
          if (!item.url) return null

          // if the url is internal, we strip the domain
          const url =
            item.url.includes('myshopify.com') ||
            item.url.includes(publicStoreDomain) ||
            item.url.includes(primaryDomainUrl)
              ? new URL(item.url).pathname
              : item.url
          return (
            <Anchor
              component={NavLink}
              className={styles.headerMenuItem}
              end
              key={item.id}
              prefetch="intent"
              underline="never"
              to={url}
              size="xl"
            >
              {item.title}
            </Anchor>
          )
        })}
      </Stack>
    </div>
  )
}

function HeaderCtas({ isLoggedIn, cart }: Pick<HeaderProps, 'isLoggedIn' | 'cart'>) {
  return (
    <nav className={styles.headerCtas} role="navigation">
      {/* <HeaderMenuMobileToggle /> */}
      <IconContext.Provider value={{ color: 'var(--mantine-color-text)', size: '100%' }}>
        <NavLink prefetch="intent" to="/account">
          {/* <Suspense fallback="Sign in">
          <Await resolve={isLoggedIn} errorElement="Sign in">
            {(isLoggedIn) => (isLoggedIn ? 'Account' : 'Sign in')}
          </Await>
        </Suspense> */}
          <Center w={{ base: 20, sm: 30 }}>
            <HiOutlineUser aria-description="account" />
          </Center>
        </NavLink>
        {/* <SearchToggle /> */}
        <CartToggle cart={cart} />
      </IconContext.Provider>
    </nav>
  )
}

// function SearchToggle() {
//   return <a href="#search-aside">Search</a>
// }

function CartLayout({ count, cart }: { count: number; cart: CartApiQueryFragment | null }) {
  const theme = useMantineTheme()
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`)

  const [opened, { toggle, close, open }] = useDisclosure()
  const [aside, setAside] = useState<HTMLDivElement | null>(null)
  const [button, setButton] = useState<HTMLAnchorElement | null>(null)

  useClickOutside(close, null, [aside, button])

  const addToCartFetchers = useCartFetchers(CartForm.ACTIONS.LinesAdd)

  // open cart aside when adding to cart
  useEffect(() => {
    if (opened || !addToCartFetchers.length) return
    open()
  }, [addToCartFetchers, opened, open])

  return (
    // <a href="#cart-aside">Cart {count}</a>
    <>
      <ActionIcon
        component={isMobile ? NavLink : undefined}
        variant="transparent"
        size="lg"
        className={styles.cartIcon}
        prefetch="intent"
        to="/cart"
        onClick={isMobile ? undefined : toggle}
        ref={setButton}
      >
        <Center w={{ base: 20, sm: 30 }}>
          <HiOutlineShoppingBag aria-description="cart" />
        </Center>
        {count > 0 && (
          <>
            <Badge className={styles.badge} size="md" circle visibleFrom="sm">
              {count}
            </Badge>
            <Badge className={styles.badge} size="xs" circle hiddenFrom="sm">
              {count}
            </Badge>
          </>
        )}
      </ActionIcon>
      <Transition
        mounted={opened}
        transition={{
          in: { transform: 'translateX(0px)' },
          out: { transform: 'translate(100%)' },
          transitionProperty: 'transform'
        }}
        duration={400}
        timingFunction="ease"
      >
        {(transitionStyle) => (
          <ScrollArea
            className={styles.cartAside}
            style={transitionStyle}
            ref={setAside}
            scrollbarSize={10}
            scrollHideDelay={250}
            styles={{ scrollbar: { zIndex: 1 } }}
          >
            <div className={styles.cartAsideContainer}>
              <div className={styles.cartAsideInnerContainer}>
                <Group className={styles.cartAsideHeader}>
                  <Title order={1} fw="var(--mantine-fw-sb)">
                    Bag{' '}
                    <Text span c="var(--mantine-color-gray-text)" size="xl" fw="var(--mantine-fw-md)">
                      ({count})
                    </Text>
                  </Title>
                  <CloseButton c="var(--mantine-color-text)" size="lg" onClick={close} />
                </Group>
                <CartMain cart={cart} close={close} />
              </div>
            </div>
          </ScrollArea>
        )}
      </Transition>
    </>
  )
}

function CartToggle({ cart }: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartLayout count={0} cart={null} />}>
      <Await resolve={cart}>{(cart) => <CartLayout count={cart?.totalQuantity || 0} cart={cart} />}</Await>
    </Suspense>
  )
}

// const FALLBACK_HEADER_MENU = {
//   id: 'gid://shopify/Menu/199655587896',
//   items: [
//     {
//       id: 'gid://shopify/MenuItem/461609500728',
//       resourceId: null,
//       tags: [],
//       title: 'Collections',
//       type: 'HTTP',
//       url: '/collections',
//       items: []
//     },
//     {
//       id: 'gid://shopify/MenuItem/461609533496',
//       resourceId: null,
//       tags: [],
//       title: 'Blog',
//       type: 'HTTP',
//       url: '/blogs/journal',
//       items: []
//     },
//     {
//       id: 'gid://shopify/MenuItem/461609566264',
//       resourceId: null,
//       tags: [],
//       title: 'Policies',
//       type: 'HTTP',
//       url: '/policies',
//       items: []
//     },
//     {
//       id: 'gid://shopify/MenuItem/461609599032',
//       resourceId: 'gid://shopify/Page/92591030328',
//       tags: [],
//       title: 'About',
//       type: 'PAGE',
//       url: '/pages/about',
//       items: []
//     }
//   ]
// }

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      resourceId: null,
      tags: [],
      title: 'Shop',
      type: 'HTTP',
      url: '/collections/shop-all',
      items: []
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      resourceId: 'gid://shopify/Page/92591030328',
      tags: [],
      title: 'About',
      type: 'PAGE',
      url: '/pages/about',
      items: []
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      resourceId: null,
      tags: [],
      title: 'Journal',
      type: 'HTTP',
      url: '/blogs/journal',
      items: []
    }
  ]
}
