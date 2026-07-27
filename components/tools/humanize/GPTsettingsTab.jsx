"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { toggleHumanizeOption } from "@/redux/slices/settings-slice";
import { useDispatch, useSelector } from "react-redux";

export default function GPTsettingsSidebar() {
  const dispatch = useDispatch();
  const { humanizeOptions, interfaceOptions } = useSelector(
    (state) => state.settings,
  );
  const humanizeOptionsMeta = [
    { key: "avoidContractions", label: "Avoid contractions", info: true },
    {
      key: "automaticStartHumanize",
      label: "Automatic start humanize",
      info: false,
    },
  ];
  // const interfaceOptionsMeta = [
  //   // { key: "useYellowHighlight", label: "Use yellow highlight", info: false },
  // ];

  return (
    <div className="p-4" id="settings_tab">
      <h2 className="mb-4 text-xl font-bold">Settings</h2>

      {/* Humanize Section */}
      <h3 className="text-muted-foreground mb-2 text-sm font-medium">
        Humanize
      </h3>
      <div className="space-y-2">
        {humanizeOptionsMeta.map(({ key, label, info }) => (
          <div
            key={key}
            className="flex items-center justify-between space-x-2"
          >
            <div className="flex items-center space-x-2">
              <Checkbox
                id={key}
                checked={humanizeOptions[key]}
                onCheckedChange={() => dispatch(toggleHumanizeOption(key))}
              />
              <label
                htmlFor={key}
                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {label}
              </label>
            </div>
            {/* {info && (
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Info className="text-muted-foreground h-4 w-4" />
              </Button>
            )} */}
          </div>
        ))}
      </div>

      {/* <Separator className="my-4" /> */}

      {/* <h3 className="text-muted-foreground mb-2 text-sm font-medium">
        Interface
      </h3>
      <div className="space-y-2">
        {interfaceOptionsMeta.map(({ key, label, info }) => (
          <div
            key={key}
            className="flex items-center justify-between space-x-2"
          >
            <div className="flex items-center space-x-2">
              <Checkbox
                id={key}
                checked={interfaceOptions[key] || false}
                onCheckedChange={() => dispatch(toggleInterfaceOption(key))}
              />
              <label
                htmlFor={key}
                className={cn(
                  "text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                )}
              >
                {label}
              </label>
            </div>
            {info && (
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Info className="text-muted-foreground h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div> */}
    </div>
  );
}
