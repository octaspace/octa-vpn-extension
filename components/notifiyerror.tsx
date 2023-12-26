import { notifications } from '@mantine/notifications';
import type { ReactNode } from 'react';

export function NotifiyError(msg:string, icon:ReactNode){
    notifications.show({
        message: msg,
        color: 'red',
        icon: icon,
        loading: false,
      })
}