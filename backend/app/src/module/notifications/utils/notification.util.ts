import { TargetDto } from "../dto/create-notification.dto";
import { ReceiversDto } from "../dto/push-notification.dto";

export function mapScopeToReceivers(
  scope: 'global' | TargetDto[],
): ReceiversDto {
  if (scope === 'global') {
    return {};
  }

  const receivers: ReceiversDto = {};
  for (const target of scope) {
    if (target.type === 'school') {
      receivers.schools = [...(receivers.schools || []), ...target.id];
    } else if (target.type === 'major') {
      receivers.majors = [...(receivers.majors || []), ...target.id];
    } else if (target.type === 'user') {
      receivers.users = [...(receivers.users || []), ...target.id];
    }
  }

  return receivers;
}
