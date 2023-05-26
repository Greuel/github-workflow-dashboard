# help function for main.py
def show_help():
    print(
        'Usage: python main.py [--org ORG] [--repo REPO] [--weekly] [--daily]')
    print('')
    print('Options:')
    print('  --repo REPO Repository name (optional)')
    print('  --weekly    Show weekly averages')
    print('  --daily     Show daily averages')
    print('  --individual Show individual workflow run durations')
    print('  --runners Show status of org runners')
