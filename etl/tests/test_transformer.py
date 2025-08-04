"""
Tests for data transformer functionality.
Ensures that our data transformations work correctly for different types of data.
"""
import sys
import os
import unittest
import pandas as pd
from datetime import datetime, date

# Add parent directory to path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from transformer import DataTransformer


class TestDataTransformer(unittest.TestCase):
    def setUp(self):
        """Set up test environment"""
        self.transformer = DataTransformer()
        
    def test_handle_timestamps(self):
        """Test timestamp handling"""
        # Create test data with timestamp
        df = pd.DataFrame({
            'created': [datetime(2023, 1, 1, 12, 0, 0), datetime(2023, 1, 2, 14, 30, 0)],
            'text_field': ['test1', 'test2']
        })
        
        # Apply transformation
        result = self.transformer._handle_timestamps(df.copy())
        
        # Check that timestamps were correctly converted to strings
        self.assertEqual(result['created'][0], '2023-01-01 12:00:00')
        self.assertEqual(result['created'][1], '2023-01-02 14:30:00')
        
    def test_handle_null_values(self):
        """Test null value handling"""
        # Create test data with nulls of different types
        df = pd.DataFrame({
            'text': [None, 'text'],
            'number': [None, 123],
            'boolean': [None, True],
            'timestamp': [None, datetime(2023, 1, 1)]
        })
        
        # Apply transformation
        result = self.transformer._handle_null_values(df.copy())
        
        # Check that nulls were replaced with appropriate values
        self.assertEqual(result['text'][0], '')
        self.assertEqual(result['number'][0], 0)
        self.assertEqual(result['boolean'][0], False)
        self.assertTrue(pd.Timestamp('1970-01-01').equals(result['timestamp'][0]))
        
    def test_calculate_age(self):
        """Test age calculation"""
        # Test with valid birthday
        today = date.today()
        years_30_ago = today.replace(year=today.year - 30)
        self.assertEqual(self.transformer._calculate_age(years_30_ago), 30)
        
        # Test with None
        self.assertEqual(self.transformer._calculate_age(None), 0)
        
    def test_transform_stay(self):
        """Test stay transformations"""
        # Create test data for stay
        df = pd.DataFrame({
            'id': ['uuid-1', 'uuid-2'],
            'arrival_date': [datetime(2023, 1, 1), datetime(2023, 2, 1)],
            'departure_date': [datetime(2023, 1, 10), datetime(2023, 2, 15)],
            'reservation_date': [datetime(2022, 12, 15), datetime(2023, 1, 15)],
            'state': [2, 1],  # Completed, Active
            'final_price': [1000.0, 1500.0],
            'company_id': [None, 'company-uuid']
        })
        
        # Apply transformation
        result = self.transformer.transform_stay(df.copy())
        
        # Check transformations were applied correctly
        self.assertEqual(result['stay_duration_days'][0], 9)
        self.assertEqual(result['stay_duration_days'][1], 14)
        self.assertEqual(result['state_text'][0], 'Completed')
        self.assertEqual(result['state_text'][1], 'Active')
        self.assertEqual(result['is_company_stay'][0], 0)
        self.assertEqual(result['is_company_stay'][1], 1)
        self.assertEqual(result['reservation_lead_time'][0], 17)
        
        # Check revenue per day calculation
        self.assertAlmostEqual(result['revenue_per_day'][0], 1000.0 / 9)
        self.assertAlmostEqual(result['revenue_per_day'][1], 1500.0 / 14)

    def test_transform_guest(self):
        """Test guest transformations"""
        # Create test data for guest
        today = date.today()
        years_30_ago = pd.Timestamp(today.replace(year=today.year - 30))
        
        df = pd.DataFrame({
            'name': ['John', 'Jane'],
            'last_name': ['Doe', 'Smith'],
            'birthday': [years_30_ago, None]
        })
        
        # Apply transformation
        result = self.transformer.transform_guest(df.copy())
        
        # Check full name was created correctly
        self.assertEqual(result['full_name'][0], 'John Doe')
        self.assertEqual(result['full_name'][1], 'Jane Smith')
        
        # Check age was calculated correctly
        self.assertEqual(result['age'][0], 30)
        self.assertEqual(result['age'][1], 0)


if __name__ == "__main__":
    unittest.main()
