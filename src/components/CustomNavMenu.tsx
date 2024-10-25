import { cn } from "@/lib/utils";
import { Link, LinkOptions } from "@tanstack/react-router";
import { useState } from "react";



export const CustomLink = (props: {
  to: LinkOptions["to"];
  params?: LinkOptions["params"];
  children: React.ReactNode;
}) => {
  return (
    <Link to={props.to} params={props.params} className="[&.active]:font-bold no-underline text-primary">
      {props.children}
    </Link>
  );
};

export const MenuLinksGroup = (props: { className?: string }) => {
  return (
    <div className={cn("flex p-2 space-x-5 flex-wrap", props.className)}>
      {/* <CustomLink to="/">Home</CustomLink> */}
      <CustomLink to="/settings">Settings</CustomLink>
      <CustomLink to="/api_import">API Import</CustomLink>
      <CustomLink to="/jupyter">Jupyter</CustomLink>
      <CustomLink to="/pivottable">Explore</CustomLink>
      <CustomLink to="/graphs">Graphs</CustomLink>
      <CustomLink to="/custom_fields">CF</CustomLink>
      <CustomLink to="/display_filtered_entries">Entries</CustomLink>
    </div>
  );
};

const CustomNavMenu = (props: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("grid sm:grid-cols-2 border-b-2", props.className)}>
      {props.children || <div></div>}
      <MenuLinksGroup className="justify-end"></MenuLinksGroup>
    </div>
  );
};

export default CustomNavMenu;
