/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
    
  }

  get fullName(){
        let name = `${this.firstName} ${this.lastName}`;
        return name;
      }


  /** find all customers. */



  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }

  static async search(name) {
    let sqlName = `%${name}%`;
    const results = await db.query(
      `SELECT id,
        first_name AS "firstName", 
        last_name AS "lastName", 
        phone, 
        notes FROM customers 
        WHERE (first_name ilike $1) OR 
        (last_name ilike $1) 
        ORDER BY last_name, first_name`, [sqlName]
    );
    return results.rows.map(c => new Customer(c));
  }

  static async topTen() {
    const results = await db.query(
      `SELECT c.id,
         c.first_name AS "firstName", 
         c.last_name AS "lastName",
         c.phone,
         c.notes
         FROM reservations AS r 
         JOIN customers AS c 
         ON r.customer_id=c.id 
         GROUP BY c.id 
         ORDER BY COUNT(c.id) 
         DESC LIMIT 10;
        `
    );
    return results.rows.map(c => new Customer(c));
  }

// SELECT first_name, last_name FROM customers WHERE (first_name ilike '%am%') OR (last_name ilike '%am%');
  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }

  
}

module.exports = Customer;
