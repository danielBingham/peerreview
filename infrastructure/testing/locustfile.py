from locust import HttpUser, task

class TestUser(HttpUser):
    @task
    def getRoot(self):
        self.client.get("/")
