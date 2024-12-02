import { cn } from "@/lib/utils";
import { Link, LinkOptions } from "@tanstack/react-router";
import { useState } from "react";

export const CustomLink = (props: {
  to: LinkOptions["to"];
  params?: LinkOptions["params"];
  children: React.ReactNode;
}) => {
  return (
    <Link
      to={props.to}
      params={props.params}
      className="[&.active]:font-bold no-underline"
    >
      {props.children}
    </Link>
  );
};

export const MenuLinksGroup = (props: { className?: string }) => {
  return (
    <div className={cn("flex p-2 space-x-5 flex-wrap", props.className)}>
      {/* <CustomLink to="/">Home</CustomLink> */}
      <CustomLink to="/settings">Settings</CustomLink>
      {/* <CustomLink to="/jupyter">Jupyter</CustomLink> */}
      <CustomLink to="/pivottable">Analyse</CustomLink>
      {/* <CustomLink to="/graphs">Graphs</CustomLink> */}
      <CustomLink to="/display_filtered_entries">Annotate</CustomLink>
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
