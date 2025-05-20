class Cola:
    def __init__(self):
        self.items = []

    def is_empty(self):
        return len(self.items) == 0

    def encolar(self, item):
        self.items.insert(0, item)

    def desencolar(self):
        return self.items.pop()

    def tamaño(self):
        return len(self.items)