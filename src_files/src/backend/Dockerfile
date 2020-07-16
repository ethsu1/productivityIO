#dockerfile for go server
FROM amd64/golang:1.14.4

#get dependenices
RUN go get github.com/gorilla/sessions
RUN go get "github.com/go-sql-driver/mysql"

WORKDIR .
#copy code and files into the container
COPY . .

RUN go build server.go

EXPOSE 8080

ARG MYSQL_USER
ARG MYSQL_PASS

CMD ["./server"]
