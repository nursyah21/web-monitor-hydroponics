import supabase
import serial
import time
import codecs

VITE_SUPABASE_URL='https://wtdtmfajzokjvmuvgzjv.supabase.co'
VITE_SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0ZHRtZmFqem9ranZtdXZnemp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjM3ODMwODAsImV4cCI6MTk3OTM1OTA4MH0.AJminOnfba8cOlYtLTPYUT78Gc00zCoSpejhb52tck4'

arduino = serial.Serial(port='/dev/ttyACM0', baudrate=9600, timeout=.1)

client = supabase.create_client(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

## select
data = client.table('hidroponik').select('*').execute()
#tangki1, tangki2, tangki3, tds float, pompa1, pompa2, pompa3, pompa4, auto bool, ppm int
print(data.data[0])

