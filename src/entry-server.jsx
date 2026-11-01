import React from "react";
import { renderToString } from "react-dom/server";
import App from "./App.jsx";
import { getCompleteSpecialMenuItems } from "./components/SpecialMenuSection.jsx";
import { renderRouteHtml, renderSitemap } from "../scripts/site-pages.mjs";
import { getRestaurantDate } from "./lib/restaurantDate.js";
import { routeHref } from "./restaurant/routes.js";

export { renderSitemap };
export function renderDocument(template, route, initialData = {}) {
  const data = {
    pathname: initialData.pathname || route.path || (route.page === "notFound" ? `${route.language === "cs" ? "" : `/${route.language}`}/404` : routeHref(route.page, route.language)),
    page: route.page, language: route.language,
    today: initialData.today || getRestaurantDate(),
    dailyMenuItems: Array.isArray(initialData.dailyMenuItems) ? initialData.dailyMenuItems : [],
    specialMenuItems: getCompleteSpecialMenuItems(initialData.specialMenuItems || []),
  };
  const markup = renderToString(<App initialData={data} />);
  return renderRouteHtml(template, route, { markup, initialData: data, hasSpecialMenu: data.specialMenuItems.length > 0 });
}
