// components/DrawerWithContent.js
import React from 'react';
import DrawerLayoutWrapper from './CustomDrawer';

export default function DrawerWithContent({ children, navigation }) {
  return <DrawerLayoutWrapper navigation={navigation}>{children}</DrawerLayoutWrapper>;
}
