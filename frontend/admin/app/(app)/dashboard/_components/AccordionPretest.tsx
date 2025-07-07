import { useMajors } from '@/hooks/useMajor';
import { useRoles } from '@/hooks/useRoles';
import { useSchools } from '@/hooks/useSchool';
import { useUsers } from '@/hooks/useUsers';
import type { Selection } from '@heroui/react';
import {
  Card,
  CardHeader,
  Divider,
  CardBody,
  Select,
  SelectItem,
  Input,
  Chip,
  Button,
  Table,
  Pagination
} from '@heroui/react';
import { useMemo, useState } from 'react';

export function AccordionPretest() {
  const { roles } = useRoles();
  const { schools } = useSchools();
  const { majors } = useMajors();
  const { users } = useUsers();

  const [page , setPage] = useState(1)
  const rowsPerPage = 5 ;
  const pages = Math.ceil( users.length / rowsPerPage )
  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage

    return users.slice(start,end)
  }, [page,users])

  const [selectRole, setSelectRole] = useState<Selection>(new Set(['All']));
  const [selectSchool, setSelectSchool] = useState<Selection>(new Set(['All']));
  const [selectMajor, setSelectMajor] = useState<Selection>(new Set(['All']));
  const [searchValue, setSearchValue] = useState('');
  const [student , setStudent] = useState(10);

  function Filter() {
    return (
      <Card>
        <CardHeader>
          <h1>Filters</h1>
        </CardHeader>
        <Divider />
        <CardBody className=" grid grid-cols-4 gap-3">
          <Select
            disallowEmptySelection
            label="Role Type"
            labelPlacement="outside"
            maxListboxHeight={150}
            selectedKeys={selectRole}
            onSelectionChange={setSelectRole}
          >
            {roles.map((roles) => (
              <SelectItem key={roles.name}> {roles.name}</SelectItem>
            ))}
          </Select>
          <Select
            disallowEmptySelection
            label="School"
            labelPlacement="outside"
            maxListboxHeight={150}
            selectedKeys={selectSchool}
            onSelectionChange={setSelectSchool}
          >
            {schools.map((schools) => (
              <SelectItem key={schools.name.en}> {schools.name.en}</SelectItem>
            ))}
          </Select>
          <Select
            disallowEmptySelection
            label="Major"
            labelPlacement="outside"
            maxListboxHeight={150}
            selectedKeys={selectMajor}
            onSelectionChange={setSelectMajor}
          >
            {majors.map((majors) => (
              <SelectItem key={majors.name.en}> {majors.name.en}</SelectItem>
            ))}
          </Select>

          <Input
            label="Search"
            labelPlacement="outside"
            placeholder="Search by name or ID.."
            value={searchValue}
            onValueChange={setSearchValue}
          />
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Filter />
      <Card>
        <CardHeader className=' flex justify-between'>
            <h3>Student Details</h3>
            <div className=' flex gap-3 items-center'>
                <Chip color='primary' variant='flat'> Students {student} </Chip>
                <Button color='primary' variant='flat' isDisabled={student === 0}>
                    <h1>Export CSV</h1>
                </Button>
            </div>
        </CardHeader>
        <CardBody>
            <Table
                bottomContent={
                    <div className=' flex w-full justify-center'>
                        <Pagination
                            page={page}
                            total={pages}
                            onChange={(page) => setPage(page)}
                        />
                    </div>
                }
            >

            </Table>
        </CardBody>
      </Card>
    </>
  );
}
