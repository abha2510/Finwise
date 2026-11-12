package com.finwise.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "okta_sub", nullable = false, updatable = false)
    private String oktaSub;

    private String email;

    @Column(nullable = false)
    private String currency = "INR";

    @Column(name = "month_start_day", nullable = false)
    private int monthStartDay = 1;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected User() {}

    public User(String oktaSub, String email) {
        this.oktaSub = oktaSub;
        this.email = email;
    }

    public Long getId() { return id; }
    public String getOktaSub() { return oktaSub; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public int getMonthStartDay() { return monthStartDay; }
    public void setMonthStartDay(int monthStartDay) { this.monthStartDay = monthStartDay; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
