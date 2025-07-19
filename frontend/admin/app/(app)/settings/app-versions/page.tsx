"use client"

import { ConfirmationModal } from "@/components/modal/ConfirmationModal";
import { PageHeader } from "@/components/ui/page-header";
import { useVersionSetting } from "@/hooks/useVersionSetting";
import { Button, Card, CardBody, CardFooter, CardHeader, Divider, Input } from "@heroui/react";
import { TabletSmartphoneIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function AppVersionsPage() {
	const {
    versionSetting,
    loading,
    error,
    fetchVersionSetting,
    updateVersionSetting,
    deleteVersionSetting,
  } = useVersionSetting()

	const [appVersion, setAppVersion] = useState('')
	const [buildNumber, setBuildNumber] = useState('')
	const [initialAppVersion, setInitialAppVersion] = useState('')
	const [initialBuildNumber, setInitialBuildNumber] = useState('')
	const [showDeleteModal, setShowDeleteModal] = useState(false)
	const [submitting, setSubmitting] = useState(false)
	const [now, setNow] = useState(new Date())

	useEffect(() => {
		const interval = setInterval(() => {
			setNow(new Date())
		}, 1000)

		return () => clearInterval(interval)
	}, [])

	useEffect(() => {
		if (versionSetting) {
			setAppVersion(versionSetting.appVersion)
			setBuildNumber(String(versionSetting.buildNumber))
			setInitialAppVersion(versionSetting.appVersion)
			setInitialBuildNumber(String(versionSetting.buildNumber))
		}
	}, [versionSetting])

	const isChanged =
		appVersion !== initialAppVersion || buildNumber !== initialBuildNumber

	const handleUndo = () => {
		setAppVersion(initialAppVersion)
		setBuildNumber(initialBuildNumber)
	}

	const handleSubmit = async () => {
		if (!appVersion || !buildNumber || !isChanged) return
		setSubmitting(true)

		try {
			await updateVersionSetting({
				appVersion,
				buildNumber: Number(buildNumber),
			})
			await fetchVersionSetting()
		} finally {
			setSubmitting(false)
		}
	}

	function formatDistanceToNow(date: Date): string {
		const now = new Date()
		const diff = now.getTime() - date.getTime()
		const seconds = Math.floor(diff / 1000)

		if (seconds < 60) return `${seconds} seconds`
		const minutes = Math.floor(seconds / 60)
		if (minutes < 60) return `${minutes} minutes`
		const hours = Math.floor(minutes / 60)
		if (hours < 24) return `${hours} hours`
		const days = Math.floor(hours / 24)
		if (days < 30) return `${days} days`
		const months = Math.floor(days / 30)
		if (months < 12) return `${months} months`
		const years = Math.floor(months / 12)
		return `${years} years`
	}

	return (
		<>
			<PageHeader description='Manage App Version Settings' icon={<TabletSmartphoneIcon />} title="App Version"/>

			<div className="max-w-2xl mx-auto ">
        <Card>
          <CardHeader>
            <h1 className="text-xl font-bold">App Version Setting</h1>
          </CardHeader>
					<Divider />
          <CardBody className="space-y-4">
            <div>
              <label className="block text-sm font-medium">App Version</label>
              <Input
                value={appVersion}
                onChange={(e) => setAppVersion(e.target.value)}
                placeholder="e.g. 1.2.3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Build Number</label>
              <Input
                type="number"
                value={buildNumber}
                onChange={(e) => setBuildNumber(e.target.value)}
                placeholder="e.g. 45"
              />
            </div>

            {versionSetting?.updatedAt && (
							<p className="text-sm text-muted-foreground">
								Last updated: {formatDistanceToNow(new Date(versionSetting.updatedAt))} ago
							</p>
						)}
          </CardBody>
					<Divider />
					<CardFooter>
						<div className="flex gap-2 items-center">
							<Button
								onPress={handleSubmit}
								isLoading={loading || submitting}
								disabled={loading || submitting || !isChanged}
								variant="flat"
								color="primary"
							>
								{versionSetting ? 'Update' : 'Create'}
							</Button>

							{isChanged && (
								<Button
									onPress={handleUndo}
									variant="bordered"
									color="default"
								>
									Undo
								</Button>
							)}

							{versionSetting && (
								<Button
									color="danger"
									variant="flat"
									onPress={() => setShowDeleteModal(true)}
									disabled={loading}
								>
									Delete
								</Button>
							)}
						</div>
					</CardFooter>
        </Card>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
					await deleteVersionSetting()
					await fetchVersionSetting()
					setBuildNumber('')
					setAppVersion('')
					setShowDeleteModal(false)
				}}
        title="Delete Version Setting?"
        body="Are you sure you want to delete the current version setting? This cannot be undone."
        confirmText="Delete"
        confirmColor="danger"
      />
		</>
	);
}