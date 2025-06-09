'use client';
import {
  CircularProgressbar,
  buildStyles
} from "react-circular-progressbar";
import { Users, Ticket, ScanLine, Star, LayoutDashboard } from 'lucide-react';
import { useCheckin } from "@/hooks/useCheckin";
import { useUsers } from "@/hooks/useUsers";
import { useSponsors } from "@/hooks/useSponsors";
import { PageHeader } from "@/components/ui/page-header";

const icons = [
  <ScanLine className="h-6 w-6 text-lime-600" />,
  <Users className="h-6 w-6 text-amber-400" />,
  <Ticket className="h-6 w-6 text-cyan-400" />,
  <Star className="h-6 w-6 text-emerald-400" />,
];

export default function Dashboard() {

  const { checkin } = useCheckin();
  const { users } = useUsers();
  const { sponsors } = useSponsors();

  return (
    <>
      <PageHeader description='System overview — quickly access key modules, recent activity, and system statistics.' icon={<LayoutDashboard />} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[{
          title: "Total Checkin",
          value: checkin.length,
          progressColor: "#65a30d",
          borderColor: "border-lime-600"
        }, {
          title: "Total User",
          value: users.length,
          progressColor: "#fbbf24",
          borderColor: "border-amber-400"
        }, {
          title: "E-voucher",
          value: 10,
          progressColor: "#22d3ee",
          borderColor: "border-cyan-400"
        }, {
          title: "Sponsor",
          value: sponsors.length,
          progressColor: "#34d399",
          borderColor: "border-emerald-400"
        }].map((item, idx) => (
          <div
            key={idx}
            className={`w-full h-36 border-b-[8px] ${item.borderColor} rounded-2xl shadow-md flex justify-between items-center  p-4 relative`}
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {icons[idx]}
                <span className="text-md font-medium ">{item.title}</span>
              </div>
              <span className="text-2xl font-bold ">{item.value}</span>
            </div>
            <div className="w-16 h-16">
              <CircularProgressbar
                value={item.value}
                maxValue={6000}
                styles={buildStyles({
                  pathColor: item.progressColor,
                  trailColor: "#e5e7eb"
                })}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}