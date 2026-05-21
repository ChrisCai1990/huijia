import { differenceInDays, parseISO, isValid } from 'date-fns';

function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = parseISO(String(dateStr));
  return isValid(d) ? d : null;
}

function daysSince(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return null;
  return differenceInDays(new Date(), d);
}

export function getReminders(clients) {
  const reminders = [];
  const today = new Date();

  for (const client of clients) {
    // 1. Needs follow-up: 7+ days since last follow-up
    const lastFollowUp = parseDate(client.nextFollowUpDate);
    if (lastFollowUp) {
      const daysOverdue = differenceInDays(today, lastFollowUp);
      if (daysOverdue >= 7) {
        reminders.push({
          clientId: client.id,
          clientName: client.name,
          type: 'needsFollowUp',
          message: `已 ${daysOverdue} 天未跟进`,
          urgency: daysOverdue >= 14 ? 'urgent' : 'warning'
        });
      }
    } else if (!client.nextFollowUpDate && client.joinDate) {
      // No follow-up date set and has been joined for 7+ days
      const daysSinceJoin = daysSince(client.joinDate);
      if (daysSinceJoin !== null && daysSinceJoin >= 7) {
        reminders.push({
          clientId: client.id,
          clientName: client.name,
          type: 'needsFollowUp',
          message: `入组 ${daysSinceJoin} 天，尚未设置跟进日期`,
          urgency: 'warning'
        });
      }
    }

    // 2. Sample not returned: 10+ days in stage 2
    if (client.stage === 2 && client.joinDate) {
      const daysInService = daysSince(client.joinDate);
      if (daysInService !== null && daysInService >= 10) {
        reminders.push({
          clientId: client.id,
          clientName: client.name,
          type: 'sampleNotReturned',
          message: `采样阶段已 ${daysInService} 天，请确认样本是否已寄回`,
          urgency: daysInService >= 14 ? 'urgent' : 'warning'
        });
      }
    }

    // 3. Review due: ~83 days since join (3-month mark)
    if (client.joinDate) {
      const daysInService = daysSince(client.joinDate);
      if (daysInService !== null && daysInService >= 80 && daysInService <= 90 && !client.tshRecheck) {
        reminders.push({
          clientId: client.id,
          clientName: client.name,
          type: 'reviewDue',
          message: `入组 ${daysInService} 天，3个月复查时间到`,
          urgency: 'info'
        });
      }

      // 4. Renewal due: ~330 days since join (approaching year-end)
      if (daysInService !== null && daysInService >= 330 && daysInService <= 365 && client.serviceType === '年度服务') {
        reminders.push({
          clientId: client.id,
          clientName: client.name,
          type: 'renewalDue',
          message: `入组 ${daysInService} 天，年度服务即将到期，请跟进续约`,
          urgency: daysInService >= 350 ? 'urgent' : 'warning'
        });
      }
    }
  }

  return reminders;
}

export function getUrgentCount(clients) {
  return getReminders(clients).filter(r => r.urgency === 'urgent').length;
}
