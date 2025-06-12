type ActivityWithMetadata = {
  _id: string;
  metadata: {
    isOpen: boolean;
    checkinStartAt: Date;
    endAt: Date;
  };
  checkedInUsers?: string[]; // or some way to identify if user checked in
};

function getCheckinStatus(activity: ActivityWithMetadata, userId: string): {
  status: number;
  message: string;
} {
  const now = new Date();
  const { isOpen, checkinStartAt, endAt } = activity.metadata;

  const hasCheckedIn = activity.checkedInUsers?.includes(userId); // or however you check this

  if (now > endAt && !hasCheckedIn) {
    return { status: -1, message: "Missed check-in window" };
  }

  if (!isOpen || now < new Date(checkinStartAt)) {
    return { status: 0, message: "Not yet open for check-in" };
  }

  if (hasCheckedIn) {
    return { status: 2, message: "You have checked in" };
  }

  if (now >= checkinStartAt && now <= endAt) {
    return { status: 1, message: "Available for check-in" };
  }

  if (now > endAt) {
    return { status: 3, message: "Activity has ended" };
  }

  return { status: 0, message: "Not open for check-in" };
}
