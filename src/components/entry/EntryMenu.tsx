import { JUMP_POINT_OPTIONS } from "@/lib/constants";
import CustomNavMenu from "../CustomNavMenu";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import EntryFilter from "../EntryFilter";
import { useSettingsStore } from "@/lib/zustand";
import { Filter } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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

        <div className="flex space-x-2">
          <Input
            type="number"
            className="w-[75px] h-7"
            value={props.currentIndex}
            onChange={(e) => {
              props.onCurrentChange(parseInt(e.target.value));
            }}
          ></Input>
          <span> / {props.maxLength}</span>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="xs"
              variant="secondary"
            >
              <div className="flex space-x-2 items-center">
                <div>Options</div>
                {filterIsActive && <Filter size={15}></Filter>}
              </div>
            </Button>
          </SheetTrigger>
          <SheetContent className="!max-w-[800px] w-full space-y-5 drop-shadow-2xl">
            <div>
              <SheetHeader className="mb-3">
                <SheetTitle>Filter</SheetTitle>
                <SheetDescription>
                  Applies filter application wide
                </SheetDescription>
              </SheetHeader>
              <div className="overflow-x-scroll">
                <EntryFilter showCount></EntryFilter>
              </div>
            </div>
            <div>
              <SheetHeader className="mb-3">
                <SheetTitle>Jump Point</SheetTitle>
                <SheetDescription>
                  Sets the default loading point for the clinicaltrials.gov
                  website in split view container
                </SheetDescription>
              </SheetHeader>
              <div>
                <Select
                  onValueChange={(e) => props.setJumpPoint(e)}
                  value={props.jumpPoint}
                >
                  <SelectTrigger className="w-[180px] h-7">
                    <SelectValue placeholder="Jump poiunt" />
                  </SelectTrigger>
                  <SelectContent>
                    {JUMP_POINT_OPTIONS.map((option) => (
                      <SelectItem value={option} key={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SheetContent>
        </Sheet>

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
