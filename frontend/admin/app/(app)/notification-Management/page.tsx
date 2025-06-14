import { PageHeader } from '@/components/ui/page-header'
import { BellDot , } from 'lucide-react'

export default function NotificationManage() {
    return (
        <>
            <PageHeader description='Create, manage, and view system notifications for specific users or roles.' icon={<BellDot />} />
            
        </>
    )
}