import { motion } from 'framer-motion';
import { Divider, Chip } from '@heroui/react';
import { School, GraduationCap, Users, MapPin, FileText, AlignLeft } from 'lucide-react';

import { Activities } from '@/types/activities';

interface ExpandedDetailsProps {
  activity: Activities;
}

export function ExpandedDetails({ activity }: ExpandedDetailsProps) {
  return (
    <motion.div
      animate={{ opacity: 1, height: 'auto' }}
      className="overflow-hidden"
      exit={{ opacity: 0, height: 0 }}
      initial={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <div className="bg-white rounded-xl border border-default-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location */}
          <div className="md:col-span-2 rounded-xl border border-default-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-primary" />
              <h5 className="text-sm font-medium text-default-700">Location</h5>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-default-500 mb-1">English</p>
                <p className="rounded-lg bg-default-50 px-3 py-2 border border-default-200">
                  {activity.location?.en || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-default-500 mb-1">Thai</p>
                <p className="rounded-lg bg-default-50 px-3 py-2 border border-default-200">
                  {activity.location?.th || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Full Details */}
          <div className="md:col-span-2 rounded-xl border border-default-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-primary" />
              <h5 className="text-sm font-medium text-default-700">Full Details</h5>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-default-500 mb-1">English</p>
                <p className="rounded-lg bg-default-50 px-3 py-2 border border-default-200 whitespace-pre-wrap">
                  {activity.fullDetails?.en || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-default-500 mb-1">Thai</p>
                <p className="rounded-lg bg-default-50 px-3 py-2 border border-default-200 whitespace-pre-wrap">
                  {activity.fullDetails?.th || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Short Details */}
          <div className="md:col-span-2 rounded-xl border border-default-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <AlignLeft className="w-4 h-4 text-primary" />
              <h5 className="text-sm font-medium text-default-700">Short Details</h5>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-default-500 mb-1">English</p>
                <p className="rounded-lg bg-default-50 px-3 py-2 border border-default-200 whitespace-pre-wrap">
                  {activity.shortDetails?.en || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-default-500 mb-1">Thai</p>
                <p className="rounded-lg bg-default-50 px-3 py-2 border border-default-200 whitespace-pre-wrap">
                  {activity.shortDetails?.th || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Divider className="my-6" />

        {/* Photo Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-default-700">Photos</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Banner Photo */}
            <div className="rounded-xl border border-default-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-default-500 mb-2">Banner Photo</p>
              {activity.photo?.bannerPhoto ? (
                <img 
                  alt="Banner"
                  className="w-full h-[200px] object-cover rounded-lg"
                  src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${activity.photo.bannerPhoto}`}
                />
              ) : (
                <div className="w-full h-[200px] bg-default-100 rounded-lg flex items-center justify-center">
                  <p className="text-default-400">No banner photo</p>
                </div>
              )}
            </div>
            
            {/* Logo Photo */}
            <div className="rounded-xl border border-default-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-default-500 mb-2">Logo Photo</p>
              {activity.photo?.logoPhoto ? (
                <img 
                  alt="Logo"
                  className="w-full h-[200px] object-contain rounded-lg"
                  src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${activity.photo.logoPhoto}`}
                />
              ) : (
                <div className="w-full h-[200px] bg-default-100 rounded-lg flex items-center justify-center">
                  <p className="text-default-400">No logo photo</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <Divider className="my-6" />

        {/* Scope Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-default-700">Activity Scope</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Schools */}
            <div className="bg-white p-4 rounded-xl border border-default-200">
              <div className="flex items-center gap-2 mb-3">
                <School className="w-4 h-4 text-primary" />
                <h5 className="text-sm font-medium">Schools</h5>
              </div>
              <div className="flex flex-wrap gap-2">
                {activity.metadata?.scope?.school?.length ? (
                  activity.metadata.scope.school.map((school, index) => (
                    <Chip key={index} size="sm" variant="flat">
                      {school}
                    </Chip>
                  ))
                ) : (
                  <p className="text-xs text-default-500">No schools specified</p>
                )}
              </div>
            </div>

            {/* Majors */}
            <div className="bg-white p-4 rounded-xl border border-default-200">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="w-4 h-4 text-primary" />
                <h5 className="text-sm font-medium">Majors</h5>
              </div>
              <div className="flex flex-wrap gap-2">
                {activity.metadata?.scope?.major?.length ? (
                  activity.metadata.scope.major.map((major, index) => (
                    <Chip key={index} size="sm" variant="flat">
                      {major}
                    </Chip>
                  ))
                ) : (
                  <p className="text-xs text-default-500">No majors specified</p>
                )}
              </div>
            </div>

            {/* Users */}
            <div className="bg-white p-4 rounded-xl border border-default-200">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-primary" />
                <h5 className="text-sm font-medium">Users</h5>
              </div>
              <div className="flex flex-wrap gap-2">
                {activity.metadata?.scope?.user?.length ? (
                  <Chip color="primary" size="sm" variant="flat">
                    {activity.metadata.scope.user.length} users
                  </Chip>
                ) : (
                  <p className="text-xs text-default-500">No users specified</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 