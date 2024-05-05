import { Grid } from '@mantine/core'

type AboutLayoutProps = {
  children?: React.ReactNode
}

export function AboutLayout({ children }: AboutLayoutProps) {
  return (
    <Grid gutter={0}>
      <Grid.Col span={{ base: 12, sm: 6 }}>{children}</Grid.Col>
    </Grid>
  )
}
