"""add image_embedding to products

Revision ID: add_image_embedding
Revises: 
Create Date: 2026-01-21

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_image_embedding'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add image_embedding column to products table
    op.add_column('products', sa.Column('image_embedding', sa.LargeBinary(), nullable=True))


def downgrade():
    # Remove image_embedding column
    op.drop_column('products', 'image_embedding')
