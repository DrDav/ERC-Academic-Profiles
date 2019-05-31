import csv

""" Counts the number of people in each subject area, for each nation. Computes also the toal. """
def group(csvfile_in, csvfile_out, fields_out):
    with open(csvfile_in, encoding="utf-8") as csv_in,\
            open(csvfile_out, "w", encoding="utf-8") as csv_out:
        
        reader = csv.DictReader(csv_in, delimiter=";")
        writer = csv.DictWriter(csv_out, fieldnames=fields_out, restval="0", delimiter=",")

        nations = {
                # (format of the object)
                #"austria": {"AGRI": 7, "total": 0},
                #"italy": {"AGRI": 8}
                }

        for row in reader:
            nation = row['nation']
            subj = row['subj']
            count = row['count']

            if(nation not in nations):
                nations[nation] = {"nation": nation, "total": 0}

            nations[nation][subj] = count;
            nations[nation]['total'] = nations[nation]['total'] + int(count);

        writer.writeheader()
        for nation in nations:
            writer.writerow(nations[nation])


if __name__ == "__main__":
    fields = [
            'nation',
            'AGRI',
            'ARTS',
            'BIOC',
            'BUSI',
            'CENG',
            'CHEM',
            'COMP',
            'DECI',
            'DENT',
            'EART',
            'ECON',
            'ENER',
            'ENGI',
            'ENVI',
            'HEAL',
            'IMMU',
            'MATE',
            'MATH',
            'MEDI',
            'NEUR',
            'NURS',
            'PHAR',
            'PHYS',
            'PSYC',
            'SOCI',
            'VETE',
            'MULT',
            'total'
            ]
    group("subject_areas.csv","subjects.csv",fields)

