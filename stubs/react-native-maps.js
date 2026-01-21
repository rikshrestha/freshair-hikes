import React from "react";
import { View } from "react-native";

export const Marker = (props) => <View {...props} />;
export const Polyline = (props) => <View {...props} />;
const MapView = React.forwardRef((props, ref) => <View ref={ref} {...props} />);

export default MapView;
