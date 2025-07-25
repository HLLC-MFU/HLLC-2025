"use client";

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalFooter,
  Divider,
  Button,
  Chip,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Image,
} from "@heroui/react";
import { Activities } from "@/types/activities";
import { School } from "@/types/school";
import { Major } from "@/types/major";
import { User } from "@/types/user";

type ActivitiesDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  activity?: Activities;
  schools: School[];
  majors: Major[];
  users: User[];
};

export default function ActivitiesDetailModal({
  isOpen,
  onClose,
  activity,
  schools,
  majors,
  users,
}: ActivitiesDetailModalProps) {
  if (!activity) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="3xl">
        <ModalContent>
          <ModalHeader>Error</ModalHeader>
          <Divider />
          <ModalBody>
            <p className="text-red-600 dark:text-red-400">No activity data provided.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} isDismissable={false} size="3xl" scrollBehavior="outside">
      <ModalContent>
        <ModalHeader>Activity Details</ModalHeader>
        <Divider />
        <ModalBody className="max-h-[200vh] overflow-y-auto space-y-6 p-4">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Basic Information</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Name (Thai)</span>
                  <p>{activity.name?.th ?? "-"}</p>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium mb-1">Name (English)</span>
                  <p>{activity.name?.en ?? "-"}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium mb-1">Acronym</span>
                  <p>{activity.acronym ?? "-"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Chip color={activity.metadata?.isOpen ? "success" : "danger"}>
                    {activity.metadata?.isOpen ? "Open" : "Closed"}
                  </Chip>
                  <Chip color={activity.metadata?.isVisible ? "success" : "danger"}>
                    {activity.metadata?.isVisible ? "Show" : "Hide"}
                  </Chip>
                  <Chip color={activity.metadata?.isProgressCount ? "success" : "danger"}>
                    {activity.metadata?.isProgressCount ? "Count" : "Not Count"}
                  </Chip>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Details</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Short (EN)</p>
                  <p>{activity.shortDetails?.en ?? "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Short (TH)</p>
                  <p>{activity.shortDetails?.th ?? "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Full (EN)</p>
                  <p className="whitespace-pre-wrap">{activity.fullDetails?.en ?? "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Full (TH)</p>
                  <p className="whitespace-pre-wrap">{activity.fullDetails?.th ?? "-"}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Location</h3>
            </CardHeader>
            <CardBody className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <p><strong>Location (TH):</strong> {activity.location?.th ?? "-"}</p>
                <p><strong>Location (EN):</strong> {activity.location?.en ?? "-"}</p>
              </div>
            </CardBody>
            {activity.location?.mapUrl && (
              <CardFooter>
                <Button
                  as="a"
                  href={activity.location.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="primary"
                  size="sm"
                  className="w-full"
                >
                  View Map
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Schedule</h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="font-medium">Start</p>
                  {activity.metadata?.startAt ? (
                    <div className="flex flex-col text-sm">
                      <span>{new Date(activity.metadata.startAt).toLocaleDateString()}</span>
                      <span className="text-default-500">
                        {new Date(activity.metadata.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ) : (
                    <span>-</span>
                  )}
                </div>
                <div>
                  <p className="font-medium">Check-in Start</p>
                  {activity.metadata?.checkinStartAt ? (
                    <div className="flex flex-col text-sm">
                      <span>{new Date(activity.metadata.checkinStartAt).toLocaleDateString()}</span>
                      <span className="text-default-500">
                        {new Date(activity.metadata.checkinStartAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ) : (
                    <span>-</span>
                  )}
                </div>
                <div>
                  <p className="font-medium">End</p>
                  {activity.metadata?.endAt ? (
                    <div className="flex flex-col text-sm">
                      <span>{new Date(activity.metadata.endAt).toLocaleDateString()}</span>
                      <span className="text-default-500">
                        {new Date(activity.metadata.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ) : (
                    <span>-</span>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Access Scope */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Access Scope</h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="font-medium">Majors</p>
                  <ul className="list-disc list-inside">
                    {activity.metadata?.scope?.major?.length ? (
                      <ul className="list-disc list-inside">
                        {activity.metadata.scope.major.map((m, index) => {
                          const majorName = majors.find((major) => major._id === m.toString())?.name.en;
                          return (
                            <li key={index}>
                              {majorName ?? "N/A"}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (<p className="text-default-500 italic">No Scope</p>)}
                  </ul>
                </div>
                <div>
                  <p className="font-medium">Schools</p>
                  <ul className="list-disc list-inside">
                    {activity.metadata?.scope?.school?.length ? (
                      <ul className="list-disc list-inside">
                        {activity.metadata.scope.school.map((s, index) => {
                          const schoolName = schools.find((school) => school._id === s.toString())?.name.en;
                          return (
                            <li key={index}>
                              {schoolName ?? "N/A"}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (<p className="text-default-500 italic">No Scope</p>)}
                  </ul>
                </div>
                <div>
                  <p className="font-medium">Users</p>
                  <ul className="list-disc list-inside">
                    {activity.metadata?.scope?.user?.length ? (
                      <ul className="list-disc list-inside">
                        {activity.metadata.scope.user.map((u, index) => {
                          const name = users.find((user) => user._id === u.toString())?.name;
                          const fullName = [name?.first, name?.middle, name?.last].filter(Boolean).join(' ');
                          return (
                            <li key={index}>
                              {fullName || "N/A"}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (<p className="text-default-500 italic">No Scope</p>)}
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Images</h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-4">
                {activity.photo?.bannerPhoto && (
                  <div>
                    <p className="text-sm mb-1">Banner</p>
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${activity.photo.bannerPhoto}`}
                      alt="Banner"
                      className="rounded-lg object-cover w-full h-auto"
                    />
                  </div>
                )}
                {activity.photo?.logoPhoto && (
                  <div>
                    <p className="text-sm mb-1">Logo</p>
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${activity.photo.logoPhoto}`}
                      alt="Logo"
                      className="rounded-lg object-cover w-full h-auto"
                    />
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </ModalBody>
        <Divider />
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
