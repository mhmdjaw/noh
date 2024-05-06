import { Button, Stack, Text } from '@mantine/core'
import styles from './ErrorLayout.module.css'
import { Link } from '@remix-run/react'

export function ErrorLayout({ message }: { message: string }) {
  return (
    <div className={styles.errorSection}>
      <div className={styles.errorSectionImage}>
        <div className="media" />
        <video className="media" autoPlay loop muted playsInline src="/test-footage.mp4"></video>
      </div>
      <div className={styles.errorSectionContent}>
        <Stack align="center" p={28}>
          <Text fw="var(--mantine-fw-sb)" fz={{ base: 28, sm: 40 }} ta="center">
            {message}
          </Text>
          <Button component={Link} to="/collections/shop-all" variant="outline" color="white" size="md">
            VIEW OUR COLLECTION
          </Button>
        </Stack>
      </div>
    </div>
  )
}
