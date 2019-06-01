#!/usr/bin/env python

import csv
from itertools import combinations

# Counts the pairs of subject areas found in the csv produced by the scopus finder
def count_pairs(file_in, file_out):
    with open(file_in, encoding="utf-8") as csv_in,\
            open(file_out, "w", encoding="utf-8") as csv_out:

        reader = csv.DictReader(csv_in, delimiter=",")
        writer = csv.DictWriter(csv_out, fieldnames=['Pair','Count'], delimiter=",")
        writer.writeheader()

        pairs = {}
        
        for row in reader:
            areas = [row['1'], row['2'], row['3']]
            for comb in combinations(areas, 2): # 2 for pairs, 3 for triples
                if(not comb[0] or not comb[1]): #or not comb[2]):
                    continue
                comb = frozenset(comb)
                pairs[comb] = pairs.get(comb, 0) + 1

        print(len(pairs.keys())) # Number of paurs
        
        for pair in pairs.keys():
            first,second = sorted(pair)
            writer.writerow({
                'Pair': first + ";" + second,
                'Count': pairs[pair]
                })


if __name__ == "__main__":
    count_pairs("data/subjects_areas_all.csv",
            "data/subjects_areas_pairs.csv")
