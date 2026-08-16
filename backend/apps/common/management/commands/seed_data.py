"""Populate the database with fictitious development data.

Creates one admin, sample customers/shopkeepers/delivery partners, categories,
approved shops and 30+ products so the whole app can be exercised immediately after
a fresh migrate. Uses `update_or_create`/`get_or_create` throughout so re-running is
safe. No real personal information is used anywhere.

    python manage.py seed_data
"""
import random
from datetime import time
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.constants import Role
from apps.accounts.models import User
from apps.catalog.models import Category
from apps.delivery.models import DeliveryPartnerProfile
from apps.products.models import Product
from apps.shops.constants import ShopStatus
from apps.shops.models import Shop, ShopKyc

# Central Bengaluru, spread with small offsets so "nearby shops" queries have
# something realistic to sort/filter by distance.
BASE_LAT, BASE_LNG = 12.9716, 77.5946


def _offset(seed):
    rnd = random.Random(seed)
    return BASE_LAT + rnd.uniform(-0.05, 0.05), BASE_LNG + rnd.uniform(-0.05, 0.05)


CATEGORIES = [
    ("Grocery", "grocery"),
    ("Fruits & Vegetables", "fruits-vegetables"),
    ("Dairy", "dairy"),
    ("Snacks", "snacks"),
    ("Beverages", "beverages"),
    ("Personal Care", "personal-care"),
    ("Household", "household"),
    ("Bakery", "bakery"),
    ("Stationery", "stationery"),
    ("Other", "other"),
]

CUSTOMERS = [
    ("Aditi Sharma", "aditi.customer@example.test", "9810000001"),
    ("Rohan Verma", "rohan.customer@example.test", "9810000002"),
    ("Priya Nair", "priya.customer@example.test", "9810000003"),
    ("Karan Mehta", "karan.customer@example.test", "9810000004"),
    ("Sneha Iyer", "sneha.customer@example.test", "9810000005"),
]

SHOPKEEPERS = [
    ("Ramesh Gupta", "ramesh.shop@example.test", "9820000001", "Gupta General Store",
     "grocery"),
    ("Lakshmi Rao", "lakshmi.shop@example.test", "9820000002", "Rao Fresh Fruits & Veggies",
     "fruits-vegetables"),
    ("Farhan Sheikh", "farhan.shop@example.test", "9820000003", "Sheikh Dairy Corner",
     "dairy"),
    ("Meera Joshi", "meera.shop@example.test", "9820000004", "Joshi Snacks & Beverages",
     "snacks"),
    ("Vikram Singh", "vikram.shop@example.test", "9820000005", "Singh Daily Needs",
     "household"),
]

DELIVERY_PARTNERS = [
    ("Suresh Kumar", "suresh.delivery@example.test", "9830000001", True),
    ("Anita Das", "anita.delivery@example.test", "9830000002", True),
    ("Imran Khan", "imran.delivery@example.test", "9830000003", False),
]

PRODUCTS_BY_SHOP = {
    "grocery": [
        ("Tata Salt", "1 kg", "28.00", None, 60),
        ("Aashirvaad Atta", "5 kg", "260.00", "245.00", 40),
        ("India Gate Basmati Rice", "1 kg", "120.00", "109.00", 35),
        ("Fortune Sunflower Oil", "1 L", "165.00", None, 50),
        ("Toor Dal", "1 kg", "150.00", "139.00", 30),
        ("Moong Dal", "1 kg", "130.00", None, 30),
        ("Sugar", "1 kg", "45.00", None, 55),
        ("MDH Garam Masala", "100 g", "85.00", None, 25),
    ],
    "fruits-vegetables": [
        ("Banana (Robusta)", "1 dozen", "55.00", None, 40),
        ("Alphonso Mango", "1 kg", "399.00", "349.00", 15),
        ("Onion", "1 kg", "35.00", None, 80),
        ("Potato", "1 kg", "30.00", None, 90),
        ("Tomato", "1 kg", "40.00", "34.00", 70),
        ("Fresh Spinach", "250 g", "20.00", None, 25),
        ("Green Capsicum", "500 g", "45.00", None, 20),
        ("Carrot", "500 g", "28.00", None, 30),
    ],
    "dairy": [
        ("Amul Gold Milk", "500 ml", "34.00", None, 100),
        ("Amul Butter", "100 g", "58.00", None, 45),
        ("Amul Masti Dahi", "400 g", "45.00", None, 40),
        ("Mother Dairy Paneer", "200 g", "90.00", "84.00", 25),
        ("Britannia Cheese Slices", "100 g", "120.00", None, 20),
        ("Nestle Curd", "400 g", "42.00", None, 35),
    ],
    "snacks": [
        ("Lay's Classic Salted", "52 g", "20.00", None, 60),
        ("Haldiram's Bhujia", "200 g", "65.00", "59.00", 40),
        ("Britannia Good Day", "200 g", "40.00", None, 50),
        ("Parle-G Biscuits", "200 g", "25.00", None, 80),
        ("Coca-Cola", "750 ml", "45.00", None, 45),
        ("Real Mixed Fruit Juice", "1 L", "110.00", "99.00", 30),
        ("Bingo Mad Angles", "72 g", "20.00", None, 40),
    ],
    "household": [
        ("Surf Excel Detergent", "1 kg", "150.00", "139.00", 30),
        ("Vim Dishwash Bar", "pack of 3", "45.00", None, 40),
        ("Harpic Toilet Cleaner", "500 ml", "99.00", None, 35),
        ("Colgate Toothpaste", "150 g", "95.00", "89.00", 50),
        ("Dettol Handwash", "200 ml", "85.00", None, 40),
        ("Good Knight Mosquito Repellent", "1 pc", "75.00", None, 30),
    ],
}


class Command(BaseCommand):
    help = "Seed the database with fictitious development data (idempotent)."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Seeding categories...")
        categories = self._seed_categories()

        self.stdout.write("Seeding admin...")
        self._seed_admin()

        self.stdout.write("Seeding customers...")
        self._seed_customers()

        self.stdout.write("Seeding shopkeepers + shops...")
        shops = self._seed_shopkeepers(categories)

        self.stdout.write("Seeding delivery partners...")
        self._seed_delivery_partners()

        self.stdout.write("Seeding products...")
        product_count = self._seed_products(shops, categories)

        self.stdout.write(self.style.SUCCESS(
            f"\nSeed complete: {len(categories)} categories, {len(shops)} shops, "
            f"{product_count} products."
        ))
        self._print_credentials()

    def _seed_categories(self):
        categories = {}
        for order, (name, slug) in enumerate(CATEGORIES):
            category, _ = Category.objects.update_or_create(
                slug=slug, defaults={"name": name, "sort_order": order, "is_active": True},
            )
            categories[slug] = category
        return categories

    def _seed_admin(self):
        if not User.objects.filter(email="admin@quickcommerce.test").exists():
            User.objects.create_superuser(
                email="admin@quickcommerce.test", password="Admin@12345",
                name="Platform Admin", phone="9800000000",
            )

    def _get_or_create_user(self, *, name, email, phone, role, password="Password@123"):
        user = User.objects.filter(email=email).first()
        if user:
            return user
        return User.objects.create_user(
            email=email, password=password, name=name, phone=phone, role=role,
        )

    def _seed_customers(self):
        for name, email, phone in CUSTOMERS:
            self._get_or_create_user(
                name=name, email=email, phone=phone, role=Role.CUSTOMER
            )

    def _seed_shopkeepers(self, categories):
        shops = []
        for idx, (name, email, phone, shop_name, category_slug) in enumerate(SHOPKEEPERS):
            owner = self._get_or_create_user(
                name=name, email=email, phone=phone, role=Role.SHOPKEEPER
            )
            lat, lng = _offset(idx)
            shop, _ = Shop.objects.update_or_create(
                owner=owner,
                defaults={
                    "name": shop_name,
                    "description": f"Your trusted neighbourhood {categories[category_slug].name.lower()} shop.",
                    "category": categories[category_slug],
                    "phone": phone,
                    "address_line": f"{idx + 1}, MG Road Cross",
                    "city": "Bengaluru",
                    "state": "Karnataka",
                    "pincode": "560001",
                    "latitude": Decimal(str(round(lat, 6))),
                    "longitude": Decimal(str(round(lng, 6))),
                    "opening_time": time(8, 0),
                    "closing_time": time(22, 0),
                    "status": ShopStatus.APPROVED,
                    "delivery_fee": Decimal("25.00"),
                    "min_order_value": Decimal("0.00"),
                    "avg_prep_minutes": 15,
                    "cod_enabled": True,
                    "is_accepting_orders": True,
                    "rating": Decimal(str(round(random.uniform(3.8, 4.8), 1))),
                    "rating_count": random.randint(20, 500),
                },
            )
            ShopKyc.objects.update_or_create(
                shop=shop,
                defaults={
                    "business_name": shop_name,
                    "gst_number": "",
                    "pan_number": "",
                    "is_verified": True,
                },
            )
            shops.append((shop, category_slug))
        return shops

    def _seed_delivery_partners(self):
        for idx, (name, email, phone, online) in enumerate(DELIVERY_PARTNERS):
            user = self._get_or_create_user(
                name=name, email=email, phone=phone, role=Role.DELIVERY_PARTNER
            )
            DeliveryPartnerProfile.objects.update_or_create(
                user=user,
                defaults={
                    "vehicle_type": "bike",
                    "vehicle_number": f"KA01AB{1000 + idx}",
                    "licence_number": f"DL{2020 + idx}{1000 + idx}",
                    "is_approved": True,
                    "is_online": online,
                    "current_latitude": Decimal(str(round(BASE_LAT, 6))),
                    "current_longitude": Decimal(str(round(BASE_LNG, 6))),
                },
            )

    def _seed_products(self, shops, categories):
        count = 0
        for shop, category_slug in shops:
            for name, unit, price, discount, stock in PRODUCTS_BY_SHOP.get(category_slug, []):
                Product.objects.update_or_create(
                    shop=shop, name=name, unit=unit,
                    defaults={
                        "category": categories[category_slug],
                        "description": f"{name} ({unit}).",
                        "price": Decimal(price),
                        "discount_price": Decimal(discount) if discount else None,
                        "stock_quantity": stock,
                        "is_available": True,
                    },
                )
                count += 1
        return count

    def _print_credentials(self):
        self.stdout.write("\n" + "=" * 70)
        self.stdout.write(self.style.WARNING("Development credentials (fictitious data only)"))
        self.stdout.write("=" * 70)
        self.stdout.write("Admin:        admin@quickcommerce.test / Admin@12345")
        self.stdout.write("Customer:     aditi.customer@example.test / Password@123")
        self.stdout.write("Shopkeeper:   ramesh.shop@example.test / Password@123")
        self.stdout.write("Delivery:     suresh.delivery@example.test / Password@123")
        self.stdout.write("(All other seeded accounts share the Password@123 password.)")
        self.stdout.write("=" * 70 + "\n")
