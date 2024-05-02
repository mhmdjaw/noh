import { Button, Checkbox, Dialog, Group, Text, TextInput, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import styles from './NewsLetter.module.css'
import { useFetcher } from '@remix-run/react'

const isBrowser = typeof window !== 'undefined'

let setNewsLetterOpened: React.Dispatch<React.SetStateAction<boolean>>

export function NewsLetter() {
  const [opened, setOpened] = useState<boolean>(false)

  useEffect(() => {
    if (isBrowser) {
      setTimeout(() => {
        setOpened((prevOpened) =>
          !prevOpened ? (localStorage.getItem('newsletter') ?? 'open') === 'open' : prevOpened
        )
      }, 3000)
    }
  }, [])

  if (isBrowser) setNewsLetterOpened = setOpened

  const newsLetterClose = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('newsletter', 'closed')
      setOpened(false)
    }
  }

  const { Form, ...fetcher } = useFetcher()
  const { data } = fetcher as { data?: { subscriber?: object; error?: { message: string } } }
  const subscribeSuccess = data?.subscriber
  const subscribeError = data?.error

  return (
    <Dialog
      opened={opened}
      withCloseButton
      onClose={newsLetterClose}
      size="xl"
      radius="md"
      position={{ top: 'calc(50% + calc(var(--mantine-header-height) / 2))', left: '50%' }}
      classNames={{ root: styles.dialog, closeButton: styles.closeButton }}
      transitionProps={{ transition: 'fade' }}
      p={{ base: 28, xs: 34 }}
      zIndex={999}
    >
      <Title order={2} mb="lg" fw="var(--mantine-fw-b)">
        NEWSLETTER
      </Title>

      {subscribeSuccess && (
        <Text fw="var(--mantine-fw-md)">
          Your subscription has been confirmed. Thank you for joining our news! You will hear from us soon.
        </Text>
      )}

      {!subscribeSuccess && (
        <>
          <Text mb="lg" fw="var(--mantine-fw-md)">
            Be the first to know about our exclusive news. Sign up to our newsletter for updates on <b>NOH</b>.
          </Text>

          <Form method="post" action="/newsletter">
            <Checkbox
              label="I agree to the Privacy Policy *"
              mb="lg"
              color="var(--mantine-color-body)"
              classNames={{ input: styles.checkboxInput }}
              variant="outline"
              name="consent"
              required
            />
            <Group className={styles.emailForm} align="flex-start" justify="flex-start">
              <TextInput
                classNames={{ wrapper: styles.emailInput }}
                placeholder="Email address *"
                style={{ flex: 1 }}
                required
                type="email"
                name="email"
                id="email"
                error={subscribeError && data.error?.message}
              />
              <Button
                variant="outline"
                color="white"
                type="submit"
                loading={fetcher.state === 'loading' || fetcher.state === 'submitting'}
                loaderProps={{ type: 'dots' }}
              >
                Subscribe
              </Button>
            </Group>
          </Form>
        </>
      )}
    </Dialog>
  )
}

export function openNewsLetter() {
  if (isBrowser) setNewsLetterOpened(true)
}
