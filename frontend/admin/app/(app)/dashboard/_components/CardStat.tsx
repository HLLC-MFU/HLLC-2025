"use client";
import { useState } from "react";
import { Card, CardHeader, CardBody, Button } from "@heroui/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CardStat({
  icon,
  label,
  children,
  colors,
  defaultOpen = false,
  isClosable = true,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  colors: string;
  defaultOpen?: boolean;
  isClosable?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = () => {
    if (isClosable) setIsOpen((prev) => !prev);
  };

  return (
    <Card isHoverable className="px-3 py-2 bg-transparent overflow-hidden">
      <CardHeader
        className="font-semibold gap-2 border-b flex items-center justify-between cursor-pointer"
        onClick={toggle}
      >
        <div className="flex items-center gap-2">
          <div
            className={`p-2 bg-${colors} text-${colors.replace(
              "100",
              "600"
            )} rounded-xl shadow-inner flex items-center justify-center`}
          >
            {icon}
          </div>
          <p>{label}</p>
        </div>

        {isClosable && (
          <Button isIconOnly size="sm" variant="light" className="ml-auto">
            {isOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        )}
      </CardHeader>

      <AnimatePresence initial={false}>
        {(isOpen || !isClosable) && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <CardBody className="flex flex-col items-center justify-center">
              {children}
            </CardBody>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
