import { JUMP_POINT_OPTIONS } from "@/lib/constants";
import CustomNavMenu from "../CustomNavMenu";
// import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectTrigger,
//   SelectValue,
//   SelectItem,
//   SelectContent,
// } from "@/components/ui/select";

// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
import EntryFilter from "../EntryFilter";
import { useSettingsStore } from "@/lib/zustand";
import { Filter } from "lucide-react";
import { Button, NumberInput, Drawer, Select } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

// import {
//   Sheet,
//   SheetContent,
//   SheetDescription,
//   SheetHeader,
//   SheetTitle,
//   SheetTrigger,
// } from "@/components/ui/sheet";

const EntryMenu = (props: {
  onNext: () => any;
  onPrev: () => any;
  currentIndex: number;
  maxLength: number;
  setJumpPoint: (value: string) => void;
  jumpPoint: string;
  onCurrentChange: (value: number) => void;
}) => {
  const filter = useSettingsStore((s) => s.filter);
  const [opened, { open, close }] = useDisclosure(false);

  const filterIsActive = filter.rules.length > 0;

  return (
    <CustomNavMenu>
      <div className="flex justify-between items-center space-x-2 p-2 overflow-x-scroll">
        <Button
          size="xs"
          onClick={props.onPrev}
          disabled={props.currentIndex == 1}
        >
          Prev
        </Button>

        <div className="flex space-x-2 items-center">
          <NumberInput
            className="w-[75px]"
            size="xs"
            value={props.currentIndex}
            onChange={(e) => {
              props.onCurrentChange(parseInt(e.toString()));
            }}
          ></NumberInput>
          <span> / {props.maxLength}</span>
        </div>

        <Button size="xs" variant="secondary" onClick={open}>
          <div className="flex space-x-2 items-center">
            <div>Options</div>
            {filterIsActive && <Filter size={15}></Filter>}
          </div>
        </Button>

        <Drawer
          opened={opened}
          onClose={close}
          title="Settings"
          position="right"
          offset={8}
          radius="md"
          size="xl"
        >
          <div>
            <h2>Filter</h2>
            <div> Applies filter application wide</div>
            <div className="overflow-x-scroll">
              <EntryFilter showCount></EntryFilter>
            </div>
          </div>
          <div>
            <h2>Jump Point</h2>
            <div>
              Sets the default loading point for the clinicaltrials.gov website
              in split view container
            </div>
            <Select
              label="Jump Point"
              data={JUMP_POINT_OPTIONS}
              searchable
              value={props.jumpPoint}
              onChange={(e) => props.setJumpPoint(e || "")}
            ></Select>
          </div>
        </Drawer>

        {/* <Dialog>
          <DialogTrigger>Options</DialogTrigger>
          <DialogContent className="w-[95%] max-w-[1000px] ">
            <DialogHeader>
              <DialogTitle>Options</DialogTitle>
              <DialogDescription></DialogDescription>
            </DialogHeader>

            
          </DialogContent>
        </Dialog> */}

        <Button
          size="xs"
          onClick={props.onNext}
          disabled={props.currentIndex == props.maxLength}
        >
          Next
        </Button>
      </div>
    </CustomNavMenu>
  );
};

export default EntryMenu;
