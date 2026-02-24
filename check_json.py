import json

data = json.load(open('vocab_data.json', encoding='utf-8'))
print('Total items:', len(data))

valid = [i for i in data if i.get('單字')]
print('Items with 單字:', len(valid))

key_counts = {}
for d in data:
    for k in d.keys():
        key_counts[k] = key_counts.get(k, 0) + 1
print('Key counts across all items:', key_counts)

print('Keys of first item:', list(data[0].keys()))

# Which items have valid 單字?
print('First 5 valid items 單字:', [i['單字'] for i in valid[:5]])
