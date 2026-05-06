import Card from './Card'
import CardHeader from './CardHeader'
import CardMenuButton from './CardMenuButton'
import { cn } from '../lib/cn'

export default function TableCard({
  title,
  headerAction,
  children,
  className,
}) {
  return (
    <Card className={className}>
      <CardHeader
        title={title}
        action={headerAction ?? <CardMenuButton />}
        divider={true}
      />
      <div className={cn('overflow-x-auto')}>{children}</div>
    </Card>
  )
}
