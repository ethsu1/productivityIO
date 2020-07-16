package main

import (
	"fmt" 
	"net/http"
	"database/sql"
	"encoding/json"
	_ "github.com/go-sql-driver/mysql"
	"strconv"
	"crypto/sha1"
	"encoding/hex"
	"github.com/gorilla/sessions"
	"os"
	//"strings"
)
	//"strings")

var db *sql.DB
type Data struct {
	Body Response
}
type Response map[string]string

var store *sessions.CookieStore
var domain =  "https://productivityio.azurewebsites.net"
//connects to SQL instance
func connectToSQL() (*sql.DB){
	//sql driver, driver-specific data source name (db name and connection info)
	mysql_user := os.Getenv("MYSQL_USER")
	mysql_pass := os.Getenv("MYSQL_PASS")
	db, err := sql.Open("mysql", mysql_user+":"+mysql_pass+"@tcp(db:3306)/")
	if err != nil {
		fmt.Println(err.Error())
	} else{
		fmt.Println("Database instance connected to successfully")
	}
	fmt.Println(db)
	return db
}

//create the database
func createDB(name string){
	_, err := db.Exec("CREATE DATABASE IF NOT EXISTS " + name)
	if err != nil {
		fmt.Println(err.Error())
	}
	//db.SetMaxOpenConns(1)
}

func useDB(name string) {
	_, err := db.Exec("USE " + name)
	if err != nil {
		fmt.Println("couldn't use " + name)
		fmt.Println(err.Error())
	}
}

//creates the User Table or Policy Table
func createTable(dbName string, query string, table string){
	useDB(dbName)

	_, table_exists := db.Query("SELECT * FROM " + table + ";")
	if table_exists != nil {
		_, err := db.Exec(query)
		if err != nil {
			fmt.Println("couldn't create table")
			fmt.Println(err.Error())
		} else{
			fmt.Println("table created successfully")
		}
	}
}


func signUpHandler(w http.ResponseWriter, r *http.Request){
	if r.Method == "POST" {
		err := r.ParseForm()
		if(err != nil){
			fmt.Println("something went wrong parsing")
			fmt.Println(err.Error())
			return
		}
		if r.PostForm != nil {
			var userid = r.FormValue("userid")
			h := sha1.New()
			h.Write([]byte(userid))
			temp := h.Sum(nil)
			hasheduser := make([]byte, hex.EncodedLen(len(temp)))
			hex.Encode(hasheduser, temp)
			var email = r.FormValue("email")
			db = connectToSQL()
			var dbName = "productivityIO"
			createDB(dbName)
			var tableName = "users"
			var policyTableName = "policies"
			var queryUserTable = "CREATE TABLE " + tableName + " ( userid varchar(255) NOT NULL, health integer default 1, tier varchar(255) default 'Wolf', timer tinyint(1) default 0, canplay tinyint(1) default 0, PRIMARY KEY(userid) )"
			var queryPolicyTable = "CREATE TABLE " + policyTableName + " ( userid varchar(255) NOT NULL, policy varchar(255), PRIMARY KEY (userid, policy) )"
			createTable(dbName, queryUserTable, tableName)
			createTable(dbName, queryPolicyTable, queryPolicyTable)
			success := addUser(dbName, hasheduser)
			if success == false{
				//user already existed
				response := make(map[string]string)
				response["email"] = email
				data := Data { response }
				//res, temp := json.Marshal(data)
				w.Header().Set("Content-Type", "application/json")
				//w.Header().Set("Access-Control-Allow-Origin", domain)
				w.Header().Set("Access-Control-Allow-Credentials", "true")
				w.WriteHeader(http.StatusCreated)
				json.NewEncoder(w).Encode(data)
				//w.Write(data)
				fmt.Println("user already in database")

			} else {
				//get session
				var session_name = userid + "-session"
				session, _ := store.Get(r, session_name)
				session.Values["authenticated"] = true;
				err := session.Save(r,w)
				if err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
        			return
				}

				//no issues adding user to database
				response := make(map[string]string)
				response["email"] = ""
				data := Data {response}
				w.Header().Set("Content-Type", "application/json")
				//w.Header().Set("Access-Control-Allow-Origin", domain)
				w.Header().Set("Access-Control-Allow-Credentials", "true")
				w.WriteHeader(http.StatusCreated)
				json.NewEncoder(w).Encode(data)
			}
		}
	}
}
func signInHandler(w http.ResponseWriter, r *http.Request){
	if r.Method == "POST" {
		err := r.ParseForm()
		if(err != nil){
			fmt.Println("something went wrong parsing")
			fmt.Println(err.Error())
			return
		}
		if r.PostForm != nil {
			var userid = r.FormValue("userid")
			var email = r.FormValue("email")
			h := sha1.New()
			h.Write([]byte(userid))
			temp := h.Sum(nil)
			hasheduser := make([]byte, hex.EncodedLen(len(temp)))
			hex.Encode(hasheduser, temp)
			db = connectToSQL()
			var dbName = "productivityIO"
			createDB(dbName)
			var tableName = "users"
			var policyTableName = "policies"
			var queryUserTable = "CREATE TABLE " + tableName + " ( userid varchar(255) NOT NULL, health integer default 1, tier varchar(255) default 'Wolf', timer tinyint(1) default 0, canplay tinyint(1) default 0, PRIMARY KEY(userid) )"
			var queryPolicyTable = "CREATE TABLE " + policyTableName + " ( userid varchar(255) NOT NULL, policy varchar(255), PRIMARY KEY (userid, policy) )"
			createTable(dbName, queryUserTable, tableName)
			createTable(dbName, queryPolicyTable, queryPolicyTable)
			success := checkUserExists(dbName, hasheduser)
			if success == false{
				//user does not exist
				response := make(map[string]string)
				response["email"] = ""
				data := Data { response }
				//res, temp := json.Marshal(data)
				w.Header().Set("Content-Type", "application/json")
				//w.Header().Set("Access-Control-Allow-Origin", domain)
				w.Header().Set("Access-Control-Allow-Credentials", "true")
				w.WriteHeader(http.StatusCreated)
				json.NewEncoder(w).Encode(data)
				//w.Write(data)
				fmt.Println("user does not exist in database")

			} else {
				session, _ := store.Get(r, userid + "-session")
				session.Values["authenticated"] = true;
				err := session.Save(r,w)
				if err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
        			return
				}
				//user is found, proceed to dashboard
				response := make(map[string]string)
				response["email"] = email
				data := Data {response}
				w.Header().Set("Content-Type", "application/json")
				//w.Header().Set("Access-Control-Allow-Origin", domain)
				w.Header().Set("Access-Control-Allow-Credentials", "true")
				w.WriteHeader(http.StatusCreated)
				json.NewEncoder(w).Encode(data)
			}
		}
	}

}


func checkUserExists(dbName string, userid []byte) (bool){
	useDB(dbName)
	stmt, err := db.Prepare("SELECT userid from users where userid = ?")
	//fmt.Println(stmt)
	if err != nil {
		fmt.Println(err.Error())
	} 
	var name string
	err = stmt.QueryRow(userid).Scan(&name)
	if err != nil {
		fmt.Println(err.Error())
		return false
	}
	//fmt.Println(name)
	return true
}

//success in adding user: true, failure: false
func addUser(dbName string, userid []byte) (bool){
	//useDB(dbName)
	exist := checkUserExists(dbName, userid)
	fmt.Println(exist)
	if exist == false {
		var insert = "INSERT INTO users (userid) VALUES (?)"
		_, err := db.Exec(insert, userid)
		if err != nil {
			fmt.Println("couldn't add user")
			fmt.Println(err.Error())
		} else{
			fmt.Println("successfully added user")
			return true
		}
	} 
	return false
}

//get health and tier
func getGameStatus(dbName string, userid []byte) (string, string) {
	useDB(dbName)
	stmt, err := db.Prepare("SELECT health, tier from users where userid = ?")
	var health string
	var tier string
	err = stmt.QueryRow(userid).Scan(&health, &tier)
	if err != nil {
		fmt.Println("couldnt get health and tier")
	}
	return health, tier
}


//determine if user can play
func getPlay(dbName string, userid []byte) (string){
	useDB(dbName)
	stmt, err := db.Prepare("SELECT canplay from users where userid =?")
	var canPlay string
	err = stmt.QueryRow(userid).Scan(&canPlay)
	if err != nil {
		fmt.Println("couldn't get canPlay")
	}
	return canPlay
}

//insert new tier level on win
func updateTier(dbName string, userid []byte, tier string){
	useDB(dbName)
	insert, err := db.Prepare("UPDATE users SET tier=? WHERE userid=?")
	if err != nil{
		fmt.Println("something went wrong with trying to update tier")
	}
	insert.Exec(tier, userid)
	fmt.Println("success in updating tier")
}

//insert game play ability
func updatePlay(dbName string, userid []byte, canPlay string, healthIncrease int){
	useDB(dbName)
	//update Health
	health, _ := getGameStatus(dbName, userid)
	newHealth, err := strconv.Atoi(health)
	fmt.Println(healthIncrease)
	if(err != nil){
		fmt.Println("something went wrong parsing health")
	}
	newHealth += healthIncrease
	if(newHealth < 1){
		newHealth = 1
	}
	fmt.Println("newHealth")
	fmt.Println(newHealth)
	insert, err := db.Prepare("UPDATE users SET canPlay=?, health=? WHERE userid=?")
	if err != nil{
		fmt.Println("something went wrong with trying to update canPlay")
	}
	insert.Exec(canPlay,newHealth, userid)
	fmt.Println("success in updating canPlay")
}

//place policy/url into policies table
func insertPolicy(dbName string, userid []byte, policy string) (bool){
	useDB(dbName)
	var insert = "INSERT INTO policies (userid, policy) VALUES (?, ?);"
	_, err := db.Exec(insert, userid, policy)
	if err != nil {
		fmt.Println("couldn't add policy")
		fmt.Println(err.Error())
		return false
	} else{
		fmt.Println("successfully added policy")
		return true
	}
}

//get all the polcies associated with a user
func getPolicies(dbName string, userid []byte) ([]string) {
	useDB(dbName)
	var num int
	stmt, err := db.Prepare("SELECT COUNT(*) from policies where userid = ?")
	err = stmt.QueryRow(userid).Scan(&num)
	if err != nil {
		fmt.Println(err.Error())
	}
	rows, err := db.Query("SELECT policy from policies where userid = ?", userid)
	if err != nil {
		fmt.Println(err.Error())
	}
	defer rows.Close()
	policies := make([]string, num)
	count := 0
	for rows.Next(){
		var policy string
		err = rows.Scan(&policy)
		if err != nil {
			fmt.Println("couldn't get policies")
		}
		policies[count] = policy
		count += 1
	}
	return policies
}

//delete policy from policies table
func deletePolicy(dbName string, userid []byte, policy string) (bool) {
	useDB(dbName)
	var query = "DELETE from policies where userid = ? and policy = ?"
	_, err := db.Exec(query, userid, policy)
	if err != nil {
		fmt.Println("could not delete policy")
		return false
	}
	return true
}

func updateTimer(dbName string, userid []byte, timer string) {
	useDB(dbName)
	insert, err := db.Prepare("UPDATE users SET timer=? WHERE userid=?")
	if err != nil{
		fmt.Println("something went wrong with trying to update timer")
	}
	insert.Exec(timer, userid)
	fmt.Println("success updating timer")
}

func getTimer(dbName string, userid []byte) (string) {
	useDB(dbName)
	stmt, err := db.Prepare("SELECT timer from users where userid =?")
	var timer string
	err = stmt.QueryRow(userid).Scan(&timer)
	if err != nil {
		fmt.Println("couldn't get timer")
	}
	return timer
}

//handle updates about if the timer is running
func handleTimer(w http.ResponseWriter, r *http.Request){
	if(r.Method == "POST"){
		w.Header().Set("Access-Control-Allow-Origin", domain)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		var dbName = "productivityIO"
		var user = r.FormValue("user")
		var timer = r.FormValue("timer")
		h := sha1.New()
		h.Write([]byte(user))
		temp := h.Sum(nil)
		hasheduser := make([]byte, hex.EncodedLen(len(temp)))
		hex.Encode(hasheduser, temp)
		var session_name = user + "-session"
		session, _ := store.Get(r, session_name)
		auth, ok := session.Values["authenticated"].(bool)
		//user is no longer authenticated
		if !ok || !auth {
			http.Redirect(w,r, domain, http.StatusSeeOther)
			//http.Error(w, "Forbidden", http.StatusForbidden)
	        return
		}
		updateTimer(dbName, hasheduser, timer)
	}
	if(r.Method == "GET"){
		w.Header().Set("Access-Control-Allow-Origin", domain)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		var dbName = "productivityIO"
		result, ok := r.URL.Query()["user"]
		if !ok{
				fmt.Println("can't get user for timer")
		}
		var user = result[0]
		h := sha1.New()
		h.Write([]byte(user))
		temp := h.Sum(nil)
		hasheduser := make([]byte, hex.EncodedLen(len(temp)))
		hex.Encode(hasheduser, temp)
		var session_name = user + "-session"
		session, _ := store.Get(r, session_name)
		auth, ok := session.Values["authenticated"].(bool)
		if !ok || !auth {
			http.Error(w, "Forbidden", http.StatusForbidden)
	        return
		}
		timer := getTimer(dbName, hasheduser)
		w.Header().Set("Content-Type", "application/json")
		fmt.Println(timer)
		json.NewEncoder(w).Encode(timer)
	}

}

//handles requests about the policy
func handlePolicy(w http.ResponseWriter, r *http.Request){
	w.Header().Set("Access-Control-Allow-Headers", "*")
	w.Header().Set("Access-Control-Allow-Origin", domain)
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Methods", "DELETE")
	fmt.Println(r.Method)
	if(r.Method == "POST"){
		var dbName = "productivityIO"
		var user = r.FormValue("user")
		var policy = r.FormValue("policy")
		h := sha1.New()
		h.Write([]byte(user))
		temp := h.Sum(nil)
		hasheduser := make([]byte, hex.EncodedLen(len(temp)))
		hex.Encode(hasheduser, temp)
		var session_name = user + "-session"
		session, _ := store.Get(r, session_name)
		fmt.Println(session_name)
		fmt.Print(session)
		auth, ok := session.Values["authenticated"].(bool)
		if !ok || !auth {
			http.Error(w, "Forbidden", http.StatusForbidden)
	        return
		}
		success := insertPolicy(dbName, hasheduser, policy)
		if(success){
			w.WriteHeader(http.StatusCreated)
		}else{
			w.WriteHeader(http.StatusConflict)
		}
	}
	if(r.Method == "GET"){
		var dbName = "productivityIO"
		var user = r.FormValue("user")
		if(len(user) == 0){
			newuser, ok := r.URL.Query()["user"]
			if !ok {
				fmt.Println("can't get user for policy")
			}
			user = newuser[0]
		}
		h := sha1.New()
		h.Write([]byte(user))
		temp := h.Sum(nil)
		hasheduser := make([]byte, hex.EncodedLen(len(temp)))
		hex.Encode(hasheduser, temp)
		var session_name = user + "-session"
		session, _ := store.Get(r, session_name)
		auth, ok := session.Values["authenticated"].(bool)
		if !ok || !auth {
			http.Error(w, "Forbidden", http.StatusForbidden)
	        return
		}
		policies := getPolicies(dbName, hasheduser)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(policies)
	}
	if(r.Method == "DELETE"){
		//w.Header().Set("Access-Control-Allow-Headers", "*")
		var dbName = "productivityIO"
		var user = r.FormValue("user")
		var policy = r.FormValue("policy")
		h := sha1.New()
		h.Write([]byte(user))
		temp := h.Sum(nil)
		hasheduser := make([]byte, hex.EncodedLen(len(temp)))
		hex.Encode(hasheduser, temp)
		var session_name = user + "-session"
		session, _ := store.Get(r, session_name)
		auth, ok := session.Values["authenticated"].(bool)
		if !ok || !auth {
			http.Error(w, "Forbidden", http.StatusForbidden)
	        return
		}
		success := deletePolicy(dbName, hasheduser, policy)
		if(success){
			w.WriteHeader(http.StatusAccepted)
		} else{
			w.WriteHeader(http.StatusNotFound)
		}
	}
}

//handles request to update tier on win
func handleTier(w http.ResponseWriter, r *http.Request){
	if(r.Method == "POST"){
		w.Header().Set("Access-Control-Allow-Origin", domain)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		var dbName = "productivityIO"
		var user = r.FormValue("user")
		var tier = r.FormValue("tier")
		h := sha1.New()
		h.Write([]byte(user))
		temp := h.Sum(nil)
		hasheduser := make([]byte, hex.EncodedLen(len(temp)))
		hex.Encode(hasheduser, temp)
		var session_name = user + "-session"
		session, _ := store.Get(r, session_name)
		auth, ok := session.Values["authenticated"].(bool)
		if !ok || !auth {
			http.Error(w, "Forbidden", http.StatusForbidden)
	        return
		}
		updateTier(dbName, hasheduser, tier)
	}
}


//handles request to update canplay (either on timer run out or logout)
func handlePlay(w http.ResponseWriter, r *http.Request){
	if r.Method == "POST" {
		fmt.Println("here")
		w.Header().Set("Access-Control-Allow-Origin", domain)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		var dbName = "productivityIO"
		var play = r.FormValue("play")
		var user = r.FormValue("user")
		health, _ := strconv.Atoi(r.FormValue("healthIncrease"))
		h := sha1.New()
		h.Write([]byte(user))
		temp := h.Sum(nil)
		hasheduser := make([]byte, hex.EncodedLen(len(temp)))
		hex.Encode(hasheduser, temp)
		var session_name = user + "-session"
		session, _ := store.Get(r, session_name)
		auth, ok := session.Values["authenticated"].(bool)
		if !ok || !auth {
			http.Error(w, "Forbidden", http.StatusForbidden)
	        return
		}
		updatePlay(dbName, hasheduser, play, health)

	} else if r.Method == "GET" {
		w.Header().Set("Access-Control-Allow-Origin", domain)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		var dbName = "productivityIO"
		var user = r.FormValue("user")
		h := sha1.New()
		h.Write([]byte(user))
		temp := h.Sum(nil)
		hasheduser := make([]byte, hex.EncodedLen(len(temp)))
		hex.Encode(hasheduser, temp)
		var session_name = user + "-session"
		session, _ := store.Get(r, session_name)
		auth, ok := session.Values["authenticated"].(bool)
		if !ok || !auth {
			http.Error(w, "Forbidden", http.StatusForbidden)
	        return
		}
		play := getPlay(dbName, hasheduser)
		response := make(map[string]string)
		response["play"] = play
		data := Data {response}
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(data)
	}

}

//updates the tier and health of the user
func handleGameStatus(w http.ResponseWriter, r *http.Request) {
	if(r.Method == "GET"){
		w.Header().Set("Access-Control-Allow-Origin", domain)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		var user = r.FormValue("user")
		var dbName = "productivityIO"
		h := sha1.New()
		h.Write([]byte(user))
		temp := h.Sum(nil)
		hasheduser := make([]byte, hex.EncodedLen(len(temp)))
		hex.Encode(hasheduser, temp)
		var session_name = user + "-session"
		session, _ := store.Get(r, session_name)
		auth, ok := session.Values["authenticated"].(bool)
		if !ok || !auth {
			http.Error(w, "Forbidden", http.StatusForbidden)
	        return
		}
		health, tier := getGameStatus(dbName, hasheduser)
		response := make(map[string]string)
		response["health"] = health
		response["tier"] = tier
		data := Data {response}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(data)
	}
}


func handleHero(w http.ResponseWriter, r *http.Request){
	w.Header().Set("Access-Control-Allow-Origin", "*")
	//var fileName = r.FormValue("file")
	//var filePath = "./" + fileName + ".png"
	http.ServeFile(w,r, "./hero.png")
	fmt.Println("trying to send hero spritesheet")
}

func handleJson(w http.ResponseWriter, r *http.Request){
	w.Header().Set("Access-Control-Allow-Origin","*")
	//var fileName = r.FormValue("file")
	//fmt.Println(fileName)
	//var filePath = "./" + fileName + ".json"
	http.ServeFile(w,r,"./hero.json")
	fmt.Println("sent hero spritesheet.json")
}

func handleBad(w http.ResponseWriter, r *http.Request){
	w.Header().Set("Access-Control-Allow-Origin", "*")
	//var fileName = r.FormValue("file")
	//var filePath = "./" + fileName + ".png"
	http.ServeFile(w,r, "./enemy.png")
	fmt.Println("trying to send enemy spritesheet")
}

func handleBadJson(w http.ResponseWriter, r *http.Request){
	w.Header().Set("Access-Control-Allow-Origin", "*")
	//var fileName = r.FormValue("file")
	//fmt.Println(fileName)
	//var filePath = "./" + fileName + ".json"
	http.ServeFile(w,r,"./enemy.json")
	fmt.Println("sent enemy spritesheet.json")
}

func handleFire(w http.ResponseWriter, r *http.Request){
	w.Header().Set("Access-Control-Allow-Origin","*")
	//var fileName = r.FormValue("file")
	//var filePath = "./" + fileName + ".png"
	http.ServeFile(w,r, "./fire.png")
	fmt.Println("trying to send fire spritesheet")
}

func handleFireJson(w http.ResponseWriter, r *http.Request){
	w.Header().Set("Access-Control-Allow-Origin", "*")
	//var fileName = r.FormValue("file")
	//fmt.Println(fileName)
	//var filePath = "./" + fileName + ".json"
	http.ServeFile(w,r,"./fire.json")
	fmt.Println("sent fire spritesheet.json")
}

func handleBackground(w http.ResponseWriter, r *http.Request){
	w.Header().Set("Access-Control-Allow-Origin", "*")
	http.ServeFile(w,r,"./background.png")
	fmt.Println("sent background image")
}


func handleLogout(w http.ResponseWriter, r *http.Request){
	w.Header().Set("Access-Control-Allow-Origin", domain)
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	fmt.Println("lolol")
	var user = r.FormValue("user")
	session, err := store.Get(r, user + "-session")
	session.Options.MaxAge = - 1
	err = session.Save(r,w)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	//redirect to home page!!!
	//http.Redirect(w,r, "/", http.StatusFound)
}

func handleAuth(w http.ResponseWriter, r *http.Request){
	w.Header().Set("Access-Control-Allow-Origin", domain)
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	var user = r.FormValue("user")
	session, _ := store.Get(r, user + "-session")
	auth, ok := session.Values["authenticated"].(bool)
	if !ok || !auth {
		http.Error(w, "Forbidden", http.StatusForbidden)
	    return
	}
	w.WriteHeader(http.StatusOK)
}

func baseHandler(w http.ResponseWriter, r *http.Request){
	http.ServeFile(w, r, "./index.html")
}

func handleJS(w http.ResponseWriter, r *http.Request){
	http.ServeFile(w,r, "./index_bundle.js")
}
func handlePic(w http.ResponseWriter, r *http.Request){
	http.ServeFile(w,r, "./8970f93a3a2c84d3899adcb539f9c896.png")
}

func main(){
	//sesssion
	var key = []byte("unlockYoPotentialpio")
	store = sessions.NewCookieStore(key)
	//initialize session correctly
	
	store.Options = &sessions.Options {
		Path:     "/",
		MaxAge:   3600 * 4, //4 hours
		HttpOnly: true,
	}
	http.HandleFunc("/signup", signUpHandler)
	http.HandleFunc("/signin", signInHandler)
	http.HandleFunc("/hero", handleHero)
	http.HandleFunc("/herojson", handleJson)
	http.HandleFunc("/bad", handleBad)
	http.HandleFunc("/badjson", handleBadJson)
	http.HandleFunc("/fire", handleFire)
	http.HandleFunc("/firejson", handleFireJson)
	http.HandleFunc("/healthtier", handleGameStatus)
	http.HandleFunc("/background", handleBackground)
	http.HandleFunc("/play", handlePlay)
	http.HandleFunc("/nexttier", handleTier)
	http.HandleFunc("/policy", handlePolicy)
	http.HandleFunc("/timer", handleTimer)
	http.HandleFunc("/logout", handleLogout)
	http.HandleFunc("/authorized", handleAuth)
	http.HandleFunc("/", baseHandler)
	http.HandleFunc("/index_bundle.js", handleJS)
	http.HandleFunc("/8970f93a3a2c84d3899adcb539f9c896.png", handlePic)

	//http.Handle("/naruto", http.StripPrefix("/", http.FileServer(http.Dir("./naruto.png"))))
	http.ListenAndServe(":8080", nil)
}
